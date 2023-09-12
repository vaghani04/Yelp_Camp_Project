const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review');

const CampgroundSchema = new Schema({
    title: String,
    image: String,
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