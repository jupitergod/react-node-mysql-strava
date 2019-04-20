var bcrypt = require('bcrypt-nodejs')
var crypto = require('crypto')

var Constants = require('../config/contants')

var db = require('./db');
// Set up User class
var User = function (param) {
  let tempObj = new Object();
  if (param) {
    let user = param.athlete
    let userRole = user.id == process.env.ADMIN_ID ? "admin" : "user"
    tempObj.userId = user.id;
    tempObj.username = user.username;
    tempObj.refresh_token = param.refresh_token;
    tempObj.access_token = param.access_token;
    tempObj.expiretime = param.expires_at;
    tempObj.role = userRole;
  }

  return tempObj;
};

var UserProfile = function (profile) {
  let tempObj = new Object()
  let user = profile.athlete;
  if (profile) {
    tempObj.userId = user.id
    tempObj.username = user.username
    tempObj.firstname = user.firstname
    tempObj.lastname = user.lastname
    tempObj.sex = user.sex

    user.badge_type_id ? tempObj.badge_type_id = user.badge_type_id : null
    user.premium ? tempObj.premium = user.premium : null
    user.resource_state ? tempObj.resource_state = user.resource_state : null
    user.summit ? tempObj.summit = user.summit : null
    user.profile ? tempObj.profile = user.profile : null
    user.profile_medium ? tempObj.profile_medium = user.profile_medium : null
    user.city ? tempObj.city = user.city : null
    user.country ? tempObj.country = user.country : null
    user.follower ? tempObj.follower = user.follower : null
    user.friend ? tempObj.friend = user.friend : null
    user.created_at ? tempObj.created_at = user.created_at : null
    user.updated_at ? tempObj.updated_at = user.updated_at : null

    profile.age ? tempObj.age = profile.age : null
    profile.height ? tempObj.height = profile.height : null
    profile.weight ? tempObj.weight = profile.weight : null
    profile.HeartRateThresholdpoint ? tempObj.HeartRateThresholdpoint = profile.HeartRateThresholdpoint : null
    profile.HeartRateMaximum ? tempObj.HeartRateMaximum = profile.HeartRateMaximum : null
    profile.HeartRaterestpulse ? tempObj.HeartRaterestpulse = profile.HeartRaterestpulse : null

    profile.hrzone0min ? tempObj.hrzone0min = profile.hrzone0min : null
    profile.hrzone0max ? tempObj.hrzone0max = profile.hrzone0max : null
    profile.hrzone1min ? tempObj.hrzone1min = profile.hrzone1min : null
    profile.hrzone1max ? tempObj.hrzone1max = profile.hrzone1max : null
    profile.hrzone2min ? tempObj.hrzone2min = profile.hrzone2min : null
    profile.hrzone2max ? tempObj.hrzone2max = profile.hrzone2max : null
    profile.hrzone3min ? tempObj.hrzone3min = profile.hrzone3min : null
    profile.hrzone3max ? tempObj.hrzone3max = profile.hrzone3max : null
    profile.hrzone4min ? tempObj.hrzone4min = profile.hrzone4min : null
    profile.hrzone4max ? tempObj.hrzone4max = profile.hrzone4max : null
    profile.hrzone5min ? tempObj.hrzone5min = profile.hrzone5min : null
    profile.hrzone5max ? tempObj.hrzone5max = profile.hrzone5max : null
    profile.vo2max ? tempObj.vo2max = profile.vo2max : null
    profile.Goalsfor2019 ? tempObj.Goalsfor2019 = profile.Goalsfor2019 : null
    profile.Eventsplanned2019 ? tempObj.Eventsplanned2019 = profile.Eventsplanned2019 : null
    profile.bikeSelect ? tempObj.bikeSelect = profile.bikeSelect : null
    profile.hrsensorSelect ? tempObj.hrsensorSelect = profile.hrsensorSelect : null
    profile.powermeterSelect ? tempObj.powermeterSelect = profile.powermeterSelect : null
  }
  return tempObj;

}

var getUserList = function (projection, callback) {
  if (projection === '') projection = '*'
  db.query('SELECT ' + projection + ' FROM user', [], function (err, rows) {
    if (err) return callback(err)
    return callback(err, rows);
  });
}

var getUser = function (projection, params, callback) {
  if (projection === '') projection = '*'
  db.query('SELECT ' + projection + ' FROM user INNER JOIN user_profile ON user.userId = user_profile.userId WHERE user.userId = ?', [params.userId], function (err, rows) {
    if (err) return callback(err)
    return callback(err, rows);
  });
}

var registerUser = function (params, callback) {
  let user = params.athlete
  db.query('SELECT * FROM user WHERE userId = ? ', [user.id], function (err, rows) {
    if (err) {
      callback(err);
    }
    if (rows.length) {
      return updateUser(params, callback);
    }
    return insertUser(params, callback);
  });
}

var updateUser = function (params, callback) {
  let user = params.athlete
  db.query('UPDATE user SET ? WHERE userId = ?', [new User(params), user.id]
    , function (err) {

      let msg = ''

      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          // If we somehow generated a duplicate user id, try again
          return updateUser(params, callback);
        }
        msg = Constants.USER_REGISTRATION_FAILED;
        return callback(err, msg)
      }
      return updateUserProfile(params, callback);

    })
}

var insertUser = function (params, callback) {
  let user = params.athlete
  let userRole = user.id == process.env.ADMIN_ID ? "admin" : "user"
  db.query(`INSERT INTO user (userId,username,access_token,refresh_token,expiretime,role) values (?,?,?,?,?,?)`,
    [user.id, user.username, params.access_token, params.refresh_token, params.expires_at, userRole],
    function (err) {
      let msg = ''
      if (err) {

        if (err.code === 'ER_DUP_ENTRY') {
          // If we somehow generated a duplicate user id, try again
          return insertUser(params, callback);
        }
        msg = Constants.USER_REGISTRATION_FAILED
        return callback(err, msg);
      }
      // Successfully created user
      return insertUserProfile(user, callback);
    }
  )
}

var updateUserProfile = function (profile, callback) {
  let userId = profile.athlete.id
  db.query(`UPDATE user_profile SET ? WHERE userId =?`, [new UserProfile(profile), userId],
    function (err) {
      let msg = ''
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return updateUserProfile(profile, callback);
        }
        msg = Constants.USER_UPDATE_FAILED
      } else
        msg = Constants.USER_UPDATE_OK
      // Successfully created user
      return callback(err, msg);
    }
  )
}

var insertUserProfile = function (user, callback) {

  db.query(`INSERT INTO user_profile (userId, username, firstname, lastname, badge_type_id, premium, resource_state, summit, sex, profile, profile_medium, city ,country,follower, friend, created_at, updated_at ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [user.id, user.username, user.firstname, user.lastname, user.badge_type_id, user.premium, user.resource_state, user.summit, user.sex, user.profile, user.profile_medium, user.city, user.country, user.follower, user.friend, user.created_at, user.updated_at],
    function (err) {
      if (err) {
        let msg = ''
        if (err.code === 'ER_DUP_ENTRY') {
          return insertUserProfile(user, callback);
        }
        msg = Constants.USER_REGISTRATION_FAILED
      }
      msg = Constants.USER_REGISTRATION_OK
      // Successfully created user
      return callback(err, msg);
    }
  )
}


var deleteUser = function (username, callback) {

  db.query('DELETE FROM users WHERE username = ?',
    [username]
    , function (err) {
      return callback(err);
    });


}

exports.insertUserProfile = insertUserProfile
exports.insertUser = insertUser
exports.updateUser = updateUser
exports.getUser = getUser
exports.registerUser = registerUser
exports.getUserList = getUserList
exports.updateUserProfile = updateUserProfile

