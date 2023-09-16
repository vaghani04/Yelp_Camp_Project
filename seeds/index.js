// This seeds folder is for our reference

const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptions, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
})

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDb = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20) + 10;
        const camp = new Campground({
            author: '64ff407b83a2243a9a609a67',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            // image: 'https://source.unsplash.com/collection/483251',
            description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus, nobis!',
            price,
            geometry: {
                type: "Point",
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708519/YelpCamp/tent3_bpcgws.jpg',
                    filename: 'YelpCamp/tent3_bpcgws'
                },
                {
                    url: 'https://res.cloudinary.com/drvz6utna/image/upload/v1694708632/YelpCamp/river3_q0r5vb.jpg',
                    filename: 'YelpCamp/river3_q0r5vb'
                }
            ]
        })
        await camp.save();
    }
}

// seedDb();
// first run this file with this code and then comment it and now add below code to close the connection with mongoose

seedDb().then(() => {
    mongoose.connection.close();
})