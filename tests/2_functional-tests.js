const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const Thread = require('../models');

chai.use(chaiHttp);

let tryout = { board: "test", delete_password: "123", text: "Hirwa"};
let result, rep_len;
let id, reply, rep_id;
suite('Functional Tests', function() {
    // 1 Creating a new thread: POST request to /api/threads/{board}
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
        this.timeout(50000);
        chai
            .request(server)
            .keepOpen()
            .post('/api/threads/:board')
            .send(tryout)
            .end((err, res) => {
                assert.equal(res.status, 200);
            })
            done();
        });
    // 2 Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}
    test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
        chai
            .request(server)
            .keepOpen()
            .get('/api/threads/hirwa')
            .end((err, res) => {
                assert.equal(res.status, 200);
                result = res.body.pop();
                rep_len = result.replies.length;
                id = result._id;
                assert.property(res.body[0], "_id");
                assert.property(res.body[0], "text");
                assert.property(res.body[0], "bumped_on");
                assert.property(res.body[0], "created_on");
                assert.property(res.body[0], "replies");
            })
            done();
        });

// 3 Reporting a thread: PUT request to /api/threads/{board}
test('Reporting a thread: PUT request to /api/threads/{board}', async function(done) {
    this.timeout(5000);
    chai
        .request(server)
        .keepOpen()
        .put('/api/threads/hirwa')
        .send({ "thread_id": id})
        .end(async (err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, "reported");
        })
        done();
    });

// 4 Creating a new reply: POST request to /api/replies/{board}
test('Creating a new reply: POST request to /api/replies/{board}', async function(done) {
    this.timeout(5000);
    chai
        .request(server)
        .keepOpen()
        .post('/api/replies/hirwa')
        .send({ "thread_id": id , "delete_password": 123, "text": "hi"})
        .end((err, res) => {
            reply = res.replies[0];
            rep_id = reply._id;
            assert.equal(res.status, 200);
            assert.equal(res.replies.length, rep_len + 1);
            assert.property(res.replies[0], "text");
            assert.property(res.replies[0], "delete_password");
        })
        done();
    });

// 5 Viewing a single thread with all replies: GET request to /api/replies/{board}
test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    chai
        .request(server)
        .keepOpen()
        .get('/api/replies/hirwa')
        .send({ "thread_id": id })
        .end((err, res) => {
            assert.equal(res.status, 200);
            let newreply = res.body.replies[0];
            // rep_id = reply._id;
            assert.property(newreply, "_id");
            assert.property(newreply, "text");
            assert.property(newreply, "created_on");
            assert.property(newreply, "bumped_on");
        })
        done();
    });
// 6 Reporting a reply: PUT request to /api/replies/{board}
test('Reporting a reply: PUT request to /api/replies/{board}', async function(done) {
    this.timeout(25000);
    chai
        .request(server)
        .keepOpen()
        .put('/api/replies/hirwa')
        .send({ "thread_id": id, "reply_id": rep_id })
        .end((err, res) => {
            assert.equal(res.text, "reported");
        })
        done();
    });

// 7 Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password
test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', async function(done) {
    this.timeout(5000);
    chai
        .request(server)
        .keepOpen()
        .delete('/api/replies/hirwa')
        .send({ "thread_id": id , "delete_password": 444, "reply_id": rep_id })
        .end((err, res) => {
            assert.equal(res.status, 200);
            console.log("text: ", res.text)
            assert.equal(res.text, "incorrect password");
        })
       done();
    });

// 8 Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password
test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', async function(done) {
    this.timeout(5000);
    chai
        .request(server)
        .keepOpen()
        .delete('/api/replies/hirwa')
        .send({ "thread_id": id , "delete_password": 123, "reply_id": rep_id })
        .end((err, res) => {
            assert.equal(res.status, 200);
            console.log("text: ", res.text)
            assert.equal(res.text, "incorrect password");
        })
        done();
    });

// 9 Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password
test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', async function(done) {
    this.timeout(15000);
    chai
        .request(server)
        .keepOpen()
        .delete('/api/threads/hirwa')
        .send({ "thread_id": id , "delete_password": 444 })
        .end((err, res) => {
          res.status(200)
            // assert.equal(res.text, "incorrect password");
        })
        done();
    });
// 10 Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password
test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
    this.timeout(10000);
    chai
        .request(server)
        .keepOpen()
        .delete('/api/threads/hirwa')
        .send({ "thread_id": id , "delete_password": 123 })
        .end((err, res) => {
          res.status(200)
            assert.equal(res.text, "success");
        })
        done();
    });

});
