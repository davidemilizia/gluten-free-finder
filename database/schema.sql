CREATE TABLE places (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type_id INT,
    category_id INT,
    country_id INT,
    region_id INT,
    city_id INT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    phone TEXT,
    email TEXT,
    website TEXT,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT REFERENCES places(id),
    user_id UUID,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE photos (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT REFERENCES places(id),
    user_id UUID,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
