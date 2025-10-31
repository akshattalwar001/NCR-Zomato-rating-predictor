import streamlit as st
import pickle
import pandas as pd
import numpy as np

st.set_page_config(
    page_title="Restaurant Rating Predictor",
    page_icon="🍽️",
    layout="centered"
)

LOCALITY_MAPPING = {
    0: ' Baani Square, Sector 50, Gurgaon',
    1: ' Chanakyapuri, New Delhi',
    2: ' Connaught Place, New Delhi',
    3: ' Cyber Hub, DLF Cyber City, Gurgaon',
    4: ' Delhi University-GTB Nagar, New Delhi',
    5: ' Greater Kailash 2 (GK2), New Delhi',
    6: ' Hauz Khas, New Delhi',
    7: ' Indirapuram, Ghaziabad',
    8: ' Janakpuri, New Delhi',
    9: ' Karkardooma, New Delhi',
    10: ' Karol Bagh, New Delhi',
    11: ' Khan Market, New Delhi',
    12: ' Malviya Nagar, New Delhi',
    13: ' NIT, Faridabad',
    14: ' Paschim Vihar, New Delhi',
    15: ' Pitampura, New Delhi',
    16: ' Punjabi Bagh, New Delhi',
    17: ' Raj Nagar, Ghaziabad',
    18: ' Rajouri Garden, New Delhi',
    19: ' Rohini, New Delhi',
    20: ' Safdarjung, New Delhi',
    21: ' Sector 18, Noida',
    22: ' Sector 29, Gurgaon',
    23: ' Sector 72, Noida',
    24: ' Vijay Nagar, New Delhi',
    25: 'Other'
}

CUISINE_MAPPING = {
    0: 'Asian',
    1: 'Bakery',
    2: 'Burger',
    3: 'Cafe',
    4: 'Chinese',
    5: 'Continental',
    6: 'Desserts',
    7: 'Fast Food',
    8: 'Finger Food',
    9: 'Italian',
    10: 'Mughlai',
    11: 'North Indian',
    12: 'Other',
    13: 'Pizza',
    14: 'South Indian',
    15: 'Street Food'
}

LOCALITY_TO_CODE = {v: k for k, v in LOCALITY_MAPPING.items()}
CUISINE_TO_CODE = {v: k for k, v in CUISINE_MAPPING.items()}

@st.cache_resource
def load_model():
    try:
        with open('restaurant_rating_model.pkl', 'rb') as f:
            model = pickle.load(f)
        return model
    except FileNotFoundError:
        st.error("Model file 'restaurant_rating_model.pkl' not found!")
        st.stop()

model = load_model()

st.title("Restaurant Rating Predictor")
st.markdown("Predict dining ratings for Delhi NCR restaurants")

st.header("Enter Restaurant Details")

col1, col2 = st.columns(2)

with col1:
    pricing = st.number_input(
        "Price for 2 people (₹)",
        min_value=100,
        max_value=10000,
        value=1000,
        step=50
    )

    locality_options = list(LOCALITY_MAPPING.values())
    locality = st.selectbox("Locality", locality_options)

    cuisine_options = list(CUISINE_MAPPING.values())
    main_cuisine = st.selectbox("Main Cuisine", cuisine_options)

with col2:
    cuisine_count = st.slider(
        "Number of Cuisines Offered",
        min_value=1,
        max_value=10,
        value=3
    )

    delivery_count = st.number_input(
        "Delivery Rating Count",
        min_value=0,
        max_value=10000,
        value=100,
        step=50
    )

    st.markdown("**Cuisine Type Flags**")
    is_north_indian = st.checkbox("Serves North Indian", value=(main_cuisine == 'North Indian'))
    is_chinese = st.checkbox("Serves Chinese", value=(main_cuisine == 'Chinese'))
    is_fast_food = st.checkbox("Is Fast Food", value=(main_cuisine == 'Fast Food'))

def prepare_features(pricing, locality, main_cuisine, cuisine_count,
                     delivery_count, is_north_indian, is_chinese, is_fast_food):
    price_thousands = pricing / 1000

    if pricing <= 750:
        price_cat_code = 0
    elif pricing <= 1750:
        price_cat_code = 1
    else:
        price_cat_code = 2

    locality_code = LOCALITY_TO_CODE[locality]
    cuisine_code = CUISINE_TO_CODE[main_cuisine]
    has_many_deliveries = 1 if delivery_count > 500 else 0

    features = np.array([[
        pricing,
        price_thousands,
        price_cat_code,
        locality_code,
        cuisine_code,
        cuisine_count,
        int(is_north_indian),
        int(is_chinese),
        int(is_fast_food),
        has_many_deliveries,
        delivery_count
    ]])

    return features

st.markdown("---")

if st.button("Predict Rating", type="primary", use_container_width=True):
    features = prepare_features(
        pricing, locality, main_cuisine, cuisine_count,
        delivery_count, is_north_indian, is_chinese, is_fast_food
    )

    prediction = model.predict(features)[0]
    prediction = np.clip(prediction, 3.9, 4.9)

    st.success("### Predicted Rating")

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown(f"<h1 style='text-align: center; color: #FF6B6B; font-size: 72px;'>{prediction:.2f}</h1>",
                    unsafe_allow_html=True)

    if prediction >= 4.5:
        st.info("**Excellent!** This restaurant is predicted to have outstanding ratings!")
    elif prediction >= 4.3:
        st.info("**Very Good!** Customers are likely to be very satisfied.")
    elif prediction >= 4.1:
        st.info("**Good** - Above average restaurant with solid ratings.")
    else:
        st.info("**Average** - Room for improvement in customer satisfaction.")

    with st.expander("See Prediction Details"):
        price_category = "Budget" if pricing <= 750 else "Mid-range" if pricing <= 1750 else "Premium"

        st.markdown(f"""
        **Input Summary:**
        - **Price Category:** {price_category} (₹{pricing})
        - **Location:** {locality}
        - **Main Cuisine:** {main_cuisine}
        - **Cuisines Offered:** {cuisine_count}
        - **Delivery Orders:** {delivery_count}
        - **High Delivery Volume:** {"Yes" if delivery_count > 500 else "No"}

        **Encoded Values (for debugging):**
        - Locality Code: {LOCALITY_TO_CODE[locality]}
        - Cuisine Code: {CUISINE_TO_CODE[main_cuisine]}
        - Price Category Code: {0 if pricing <= 750 else 1 if pricing <= 1750 else 2}
        """)

st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray;'>
    <small>Contributors : Akshat Talwar & Waqar Akhtar<br>
    Predictions based on Zomato Restaurants in Delhi NCR data</small>
</div>
""", unsafe_allow_html=True)