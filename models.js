const mongoose = require('mongoose')
/**
 * {
 *    text: [string]
 *    delete_password: [hashed pass]
 *    _id: [mongoDb]
 *    created_on: [date & time _ mongoDb]
 *    bumped_on: [data & time _same as created_on - starts now]
 *    reported: boolean
 *    replies: [array] {
 *        text: string, 
 *        delete_password: hashed pass
 *        _id(thread_id): same as _id
 *        created_on: time _ update the bumped _ on
 *        reported: boolean
 *    }
 * } 
 */

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const replySchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    delete_password: {
        type: String,
        required: true,
    },
    reported: {
        type: Boolean,
        default: false,
    }
}, {timestamps: true});

const threadSchema = new mongoose.Schema({
    board: {
        type: String,
    },
    text: {
        type: String,
        required: true,
    },
    delete_password: {
        type: String,
        required: true,
    },
    bumped_on: {
        type: Date,
    },
    reported: {
        type: Boolean,
        default: false,
    },
    replies: {
        type: [replySchema],
        required: false,
    },
}, { timestamps: true });

threadSchema.pre('save', function(next) {
    if (!this.bumped_on) {
        this.bumped_on = this.createdAt;
    }
    next();
})

const Reply = mongoose.model('Reply', replySchema);
const Thread= mongoose.model('Thread', threadSchema);

module.exports = { Reply, Thread }
