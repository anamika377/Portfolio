var express = require('express')
var app = express()
var session = require('express-session')
var port = 4000
var login_obj = require('./api/api_login')

var bodyParser = require('body-parser');
app.use(session({secret:'shhhhh'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


var mongoose = require('mongoose')
var MongoClient = require('mongodb').MongoClient
var url = "mongodb://localhost:27017/"
var is_loggedin = false
var session_obj;
app.use(express.static(__dirname + '/'));

app.set('view engine', 'html');
app.set('views', __dirname);

var flash = require('connect-flash')
app.use(flash())
// app.use(function(req, res, next) {
//     res.locals.messages = req.flash();
//     next();
// });

app.listen(port)
console.log('server satarted runnig at '+port)


app.get('/',function(req,res){
	req.session.destroy(function(err){
		if(err){
			throw err
		}else{
			res.redirect('/views/index.html');
		}
	})
	
})

app.post('/api/login',function(req,res){
	let emp = req.body
	// console.log(req.body)
	MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
		if(err){
			throw err
		}
		var dbo = db.db('portfolio')
		console.log('connection successful')
		var login_cred = {'uname':emp.username,'pass':emp.password}
		dbo.collection('users').findOne(login_cred,function(err,result){
			if(err){
				throw err
			}
			if(result != null){
				// loggedin successfully
				session_obj = req.session
				session_obj.fname = result.fname
				session_obj.email_id = result.email_id
				session_obj.is_superadmin = result.is_superadmin
				session_obj.is_superadmin = result.is_superadmin
				session_obj.is_employer = result.is_employer
				session_obj.is_employee = result.is_employee
				session_obj.user_id = result._id
				is_loggedin = true
				db.close();
				res.json({'msg':1})
			}else{
				db.close()
				res.json({'msg':'Oops!wrong credentials.'})
			}
		})
	})
})

app.get('/api/user',function(req,res){
	if(req.session){
		res.json(req.session)
	}else{
		res.redirect('/')
	}
})

app.get('/api/joblist',function(req,res){
	if(req.session){
			//means user logged in
			MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
				if(err){
					throw err
				}
				var dbo = db.db('portfolio')
				var join = {
							$lookup:
								{
									from:'users',
									localField:'posted_by',
									foreignField:'_id',
									as:'user_details'	
								}
							}
				dbo.collection('job').aggregate([join]).sort({'create_time':-1}).toArray(function(err,result){
					if(err)
						throw err
					db.close()
					res.json(result)
				})
			})
	}else{
		res.json({'msg':'please login to continue.'})
	}
})

app.post('/api/logout',function(req,res){
	req.session.destroy(function(err){
		if(err){
			throw err
		}else{
			res.redirect('/')
		}
	})
})

app.post('/api/postjob',function(req,res){
	if(req.session == null){
		res.end('please login first')
	}
	if(req.body.job_title == '' || req.body.jd == '' || req.body.dept == ''){
		console.log('all are empty')
		res.render('/views/profile/jobpost.html',{'msg':'empty values sent'})
	}
	var job = {
				'job_title':req.body.job_title,
				'dept':req.body.dept,
				'job_description':req.body.jd.trim(),
				'posted_by':mongoose.Types.ObjectId(req.session.user_id),
				'create_time':new Date(),
				'updated_by':req.session.user_id
			   }
	if(job != null){
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			if(err)
				throw err
			var dbo = db.db('portfolio')
			dbo.collection('job').insertOne(job,function(err,result){
				if(err)
					throw err
				if(result != null){
					db.close()
					res.redirect('/views/profile/profile.html')
				}
			})
		})
	} else {
		res.redirect('./jobpost.html')
	}
})

app.post('/api/update',function(req,res){
	if(req.session==null){
		res.redirect('/views/index.html')
	}
	console.log(req.body)
	if(req.body != '' || req.body != null){
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			if(err)
				throw err
			var dbo = db.db('portfolio')
			var update_obj = {'_id':mongoose.Types.ObjectId(req.body.hidden_id)}
			var new_values = {$set:{'job_title':req.body.job_title,'dept':req.body.dept,'job_description':req.body.jd,'updated_time':new Date()}}
			dbo.collection('job').updateOne(update_obj,new_values,function(err,result){
				if(err)
					throw err
				if(result != null){
					console.log('one doc updated')
					db.close()
					res.redirect('/views/profile/profile.html')
				}
			})
		})
	}
	else {
		db.close()
		res.redirect('/views/profile/profile.html')
	}
})

app.get('/api/delete/:id',function(req,res){
	if(req.session==null){
		res.redirect('/views/index.html')
	}
	if(req.params.id != '' || req.params.id != null){
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			if(err)
				throw err
			var dbo = db.db('portfolio')
			var del_obj = {'_id':mongoose.Types.ObjectId(req.params.id)}
			dbo.collection('job').deleteOne(del_obj,function(err,result){
				if(err)
					throw err
				if(result != null){
					console.log('one doc deleted')
					db.close()
					res.json({'msg':1})
				}
			})
		})
	}
	else{
		db.close()
		res.redirect('/views/profile/profile.html')
	}
	
})