const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

// https://res.cloudinary.com/drvz6utna/image/upload/w_300/v1694708519/YelpCamp/tent3_bpcgws.jpg

const ImageSchema = new Schema({
    url: String,
    filename: String
})

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
});

// Assuming CampgroundSchema is a mongoose schema, this line sets up a post middleware
// to be executed after the 'findOneAndDelete' operation on instances of CampgroundSchema.
CampgroundSchema.post('findOneAndDelete', async function (doc) {
    // This block of code is executed only if a document was found and deleted.
    if (doc) {
        // This line waits for the asynchronous deletion of reviews associated with the deleted campground.
        await Review.deleteMany({
            // This query targets reviews whose '_id' is in the 'reviews' array of the deleted campground.
            _id: {
                $in: doc.reviews
            }
        });
    }
    // End of the post middleware function.
});


module.exports = mongoose.model('Campground', CampgroundSchema);