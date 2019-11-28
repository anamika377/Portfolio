// Login API
var MongoClient = require('mongodb').MongoClient
var url = "mongodb://localhost:27017/"
var is_loggedin = false
exports.login = function(req,username,password){
	var data=[]
	MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
		if(err){
			throw err
		}
		console.log('connection successful')
		var dbo = db.db('portfolio')
		var login_obj = {
							uname:username,
							pass:password
						}
		dbo.collection('users').find(login_obj).toArray(function(err,result){
			if(err){
				throw err
			}
			console.log(result)
			console.log(result.length)
			console.log(result[0])
			console.log(result[0].fname)
			db.close()
			if(result.length == 1){
				// loggedin successfully
				session_obj = req.session
				console.log(req.session)
				session_obj.fname = result[0].fname
				session_obj.email_id = result[0].email_id
				session_obj.is_superadmin = result[0].is_superadmin
				is_loggedin = true
			}else{
				return 'Oops! Wrong credentials.'
			}
			db.close()
		})

	})
}
