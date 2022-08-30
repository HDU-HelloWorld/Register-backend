var express = require('express')
var router = express.Router()
const { Sequelize, DataTypes, Model } = require('sequelize')
const request = require('request')
const { encodeGBK } = require('gbk-string')

// 连接postgres数据库
const sequelize = new Sequelize('register-hw', 'helloworld', 'hw2022', {
  host: 'localhost',
  dialect: 'postgres',
})
class User extends Model { }


User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gender: {
    type: DataTypes.STRING(1),
    allowNull: false,
  },
  stuNum: { // 八位数字学号
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[0-9]{8}$/,
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[0-9]{11}$/,
    }
  },
  qqnumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  college: { // 学院
    type: DataTypes.STRING,
    allowNull: false,
  },
  department: { // 志愿部门
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  selfIntroduction: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  honor: {// 获奖经历
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, { sequelize, modelName: 'NewMember' })
User.sync({ alter: true })

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    await sequelize.authenticate()
    console.log('数据库成功连接.')
  } catch (error) {
    console.error('数据库连接失败:', error)
  }
  res.send('api index')
})

router.post('/register', async function (req, res, next) {
  console.log('收到数据')
  let formData = req.body
  console.log(formData)
  try {
    // 将传入的数据写入数据库
    const form = await User.create(formData)
    console.log(form.toJSON())
    res.send('报名表提交成功！')
  } catch (error) {
    console.log(error.parent)
    let errorMsg = {
      msg: error.parent.detail,
      name: error.name
    }
    console.log(errorMsg)
    res.send(errorMsg, 500)
  }
})

router.post('/getAuthCode', async function (req, res, next) {
  try {
    console.log('尝试连接梦网云')
    let Mapi = {
      'apikey': '190f304e388e9516a8d90e38cee777ed',
      'mobile': '',
      'content': ""
      // 'content': "%d1%e9%d6%a4%c2%eb%a3%ba6666%a3%ac%b4%f2%cb%c0%b6%bc%b2%bb%d2%aa%b8%e6%cb%df%b1%f0%c8%cb%c5%b6%a3%a1"
    }
    data = req.body
    phoneNum = data.phone
    timestamp = data.timestamp
    authCode = data.code
    // 校验手机号
    if (!(/^1[3-9][0-9]\d{8}$/.test(phoneNum))) {
      res.send({
        msg: '手机号格式不正确',
        name: 'ValidationError'
      }, 500)
      return
    }
    Mapi.mobile = phoneNum
    Mapi.content = `验证码：${authCode}，打死都不要告诉别人哦！`
    // 将Mapi.content内容转为GBK明文格式
    Mapi.content = encodeGBK(Mapi.content)
    const options = {
      url: 'http://api01.monyun.cn:7901/sms/v2/std/single_send',
      json: true,
      body: Mapi,
    }
    console.log(Mapi)
    request.post(options, (err, res, body) => {
      // console.log(req);
      // console.log(res);
      console.log(body)
      console.log(Mapi.content)
      if (err) {
        console.log(err)
      }
    })
  } catch (error) {
    console.log(error)
  }
  res.send('验证码发送成功')
})

module.exports = router
