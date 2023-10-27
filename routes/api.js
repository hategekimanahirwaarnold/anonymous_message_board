'use strict';
const { Reply, Thread } = require('../models');
const bcrypt = require('bcrypt');



module.exports = function(app) {
  
  app.route('/api/threads/:board')
  .post(async (req, res) => {
  /**
   * {
   *    text: [string]
   *    delete_password: [hashed pass]
   *    _id: [mongoDb]
   *    created_on: [date & time _ mongoDb]
   *    bumped_on: [data & time _same as created_on - starts now]
   *    reported: boolean
   *    replies: [array]
   */
    let board = req.body.board;
    let deleteP = req.body.delete_password;
    const thread = new Thread({ board: req.body.board, text: req.body.text, delete_password: bcrypt.hashSync(deleteP, 10) });
    thread.save()
    .then((data) => {
      // console.log(data);
      return res.redirect(`/b/${board}/`);
    })
    .catch(err => {
      console.log("Error: ", err);
    });
  })
  
  .get(async (req, res) => {
/**
 * get request: /api/threads/{board}
 * return: Returned will be an array of the most recent 10 bumped threads on the 
 * board with only the most recent 3 replies for each.
 * The reported and delete_password fields will not be sent to the client.
 */
// get the most recent threads using query
    console.log("param: ", req.params, "query: ", req.query);
    const data =  await Thread.find( req.params )
    .sort({createdAt: -1})
    .limit(10);
    if (data) {
      let cleaned = data.map(item => {
        let replycount = item.replies.length;
        item.replies = item.replies.reverse().slice(0, 3);
        let allRep = item.replies.map ((ele) => {
          ele = {
            text: ele.text,
            created_on: ele.createdAt,
            _id: ele._id,
          }
          return ele;
        })
        item = {
          _id: item._id,
          text: item.text,
          replies: allRep,
          created_on: item.createdAt,
          bumped_on: item.bumped_on,
          replycount: replycount
        }
        return (item);
      });
      // console.log("All items: ", cleaned);
      return res.send(cleaned);
    }
  })

  .delete(async (req, res) => {
/**
 * delete request: /api/threads/{board}
 * with: thread_id & delete_password => delete thread.
 * return: Returned will be the string incorrect password or success.
 */
    let data = await Thread.findById(req.body.thread_id);
    if (data) {
      bcrypt.compare(req.body.delete_password, data.delete_password, async (err, resp) => {
        if (err) {
          console.log(err);
          res.status(404);
          return res.send("incorrect password");
        } else if (resp) {
          Thread.deleteOne(data)
          .then(ans => {
            return res.send("success");
          }).catch(err => console.log("Error: ", err));
        }
      })
    }
  })

  .put(async (req, res) => {
/**
 * put request: /api/threads/{board}
 * with report_id = thread_id
 * Return: Returned will be the string reported.
 *         The reported value of the thread_id will be changed to true.
 */
    console.log("report: ", req.body);
    Thread.findById(req.body.thread_id || req.body.report_id)
    .then(data => {
      if (data)  {
        data.reported = true,
        data.save()
        .then(ele => {
          console.log("Reported: ", ele);
          return res.send("reported");
        }).catch(err => console.log("Error: ", err));
      }
    })
  });

  app.route('/api/replies/:board')
  .post(async (req, res) => {
    /**
    * {
    * text: string, 
    * delete_password: hashed pass
    * _id(thread_id): same as _id
    * created_on: time _ update the bumped _ on
    * reported: boolean
    * }
    */
   console.log(req.body);
    bcrypt.hash(req.body.delete_password, 10, (err, hash) => {
        bcrypt.compare(req.body.delete_password, hash, async (err, resp) => {
          // console.log(resp)
          if (resp) {
            const thread = await Thread.findById(req.body.thread_id)
            if (thread) {
              // console.log(thread);
              const reply = new Reply({
                text: req.body.text,
                delete_password: hash,
              });
              reply.save()
              .then(data => {
                // console.log('new reply: ', data);
                thread.bumped_on = data.createdAt;
                thread.replies.push(data);
                thread.save()
                .then(newT => {
                  // console.log("New thread: ", newT);
                  return res.send(newT);
                })
                .catch(err => console.log("Error: ", err));
              })
              .catch(err => {
                return console.log("Error: ", err);
              })
            }
          }
        })
    });
  
  })

  .get(async (req, res) => {
/**
 * get request /api/replies/{board}?thread_id={thread_id}
 * Return: Returned will be the entire thread with all its replies, also excluding 
 *          the same fields from the client as the previous test.
 */
    // console.log("query: ", req.query);
    const { thread_id } = req.query;
    let item = await Thread.findById(thread_id)
    if (item) {
        let allRep = item.replies.map ((ele) => {
          ele = {
            text: ele.text,
            created_on: ele.createdAt,
            _id: ele._id,
          }
          return ele;
        })
        item = {
          _id: item._id,
          text: item.text,
          replies: allRep,
          created_on: item.createdAt,
          bumped_on: item.bumped_on,
        }
      // console.log("All items: ", item);
      return res.send(item);
    }
  })

  .delete(async (req, res) => {
/**
 * delete request: /api/replies/{board}
 * with: thread_id & reply_id, & delete_password.
 * return:  Returned will be the string incorrect password or success.
 *          On success, the text of the reply_id will be changed to [deleted]
 */
    let rep_id = req.body.reply_id;
    Thread.findById(req.body.thread_id)
    .then(data => {
      let item = data.replies.filter(ele => ele.id == rep_id );
        if (item) {
          item = item[0]
          bcrypt.compare(req.body.delete_password, item.delete_password, (err, resp) => {
            if (err) {
              console.log("Error: ", err);
            } else if (resp) {
               item.text = "[deleted]" 
               data.save()
               .then(ans => {
                return res.send("success");
               })
            } else {
              return res.send("incorrect password");
            }
          })
        } else {
          return res.send("Incorrect reply Id");
        }
    }).catch(err => console.log("Error: ", err));
  })

  .put(async (req, res) => {
 /**
 * put request: /api/replies/{board}
 * with thread_id & reply_id
 * return: Returned will be the string reported.
 *          The reported value of the reply_id will be changed to true.
 */
    const { thread_id, reply_id } = req.body;
    Thread.findById(thread_id || req.body.report_id)
    .then(data => {
      if (data) {
        let find = data.replies.filter(ele => {
          if (ele.id == reply_id)
          {
            ele.reported = true;
            return ele;
          }
        });
        if (find) {
          find.reported = true;
          data.save()
          .then(ele => {
            return res.send("reported");
          }).catch (err => {
            console.log("Error: ", err);
            res.status(404);
            return res.send("Error: Reply not found!");
          }).catch(err => console.log(err));
        } else {
          return res.send("reply not found!");
        }
      } else {
        return res.send("Thread not found!");
      }
    })
  })
};
