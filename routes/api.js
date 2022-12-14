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
class Verify extends Model { }
class Draw extends Model { }


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
  },
  qualified: {  // 剩余抽奖次数
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, { sequelize, modelName: 'NewMember' })
User.sync({ alter: true })

// 存放验证码
Verify.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[0-9]{11}$/,
    }
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, { sequelize, modelName: 'Verify' })
Verify.sync({ alter: true })

// 存放奖品数据
Draw.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  remain: {
    // 剩余奖品数量
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  first: {
    // 一等奖数量
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  second: {
    // 二等奖数量
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  third: {
    // 三等奖数量
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { sequelize, modelName: 'Awards' })
Draw.sync({ alter: true })

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
  let newCode
  try {
    let data = req.body
    let phoneNum = data.phone
    let timestamp = data.timestamp
    let authCode = data.code
    // 校验手机号
    if (!(/^1[3-9][0-9]\d{8}$/.test(phoneNum))) {
      res.send({
        msg: '手机号格式不正确',
        name: 'ValidationError'
      }, 500)
      return
    }
    // console.log('尝试连接梦网云')
    let Mapi = {
      'apikey': '190f304e388e9516a8d90e38cee777ed',
      'mobile': '',
      'content': ""
      // 'content': "%d1%e9%d6%a4%c2%eb%a3%ba6666%a3%ac%b4%f2%cb%c0%b6%bc%b2%bb%d2%aa%b8%e6%cb%df%b1%f0%c8%cb%c5%b6%a3%a1"
    }
    // 查看数据库中是否有该手机号
    const verify = await Verify.findOne({
      where: {
        phone: phoneNum
      }
    })
    if (verify) {
      // 如果有，判断验证码是否过期
      let time = verify.time
      let now = new Date()
      let diff = now - time
      if (diff > 50000) {
        // 如果过期，则生成新的4位验证码并更新时间
        newCode = Math.floor(Math.random() * 9000 + 1000)
        await Verify.update({
          code: newCode,
          time: now
        }, {
          where: {
            phone: phoneNum
          }
        })
        console.log('验证码已更新')
        // 发送验证码
        Mapi.mobile = phoneNum
        Mapi.content = encodeGBK(`验证码：${newCode}，打死都不要告诉别人哦！`)
        const options = {
          url: 'http://api01.monyun.cn:7901/sms/v2/std/single_send',
          json: true,
          body: Mapi,
        }
        request.post(options, (err, response, body) => {
          // console.log(req);
          // console.log(res);
          console.log(body)
          console.log(Mapi.content)
          if (err) {
            console.log(err)
          }
          res.status(200).send(String(newCode))
        })
      } else {
        // 一分钟内不重复发送
        console.log('一分钟内不重复发送')
        res.status(204).send('验证码发送时间过短')
      }
    } else {
      // 如果没有，生成新的4位验证码并写入数据库
      newCode = Math.floor(Math.random() * 9000 + 1000)
      await Verify.create({
        phone: phoneNum,
        code: newCode,
        time: new Date()
      })
      console.log('验证码已生成')
      // 发送验证码
      Mapi.mobile = phoneNum
      Mapi.content = encodeGBK(`验证码：${newCode}，打死都不要告诉别人哦！`)
      const options = {
        url: 'http://api01.monyun.cn:7901/sms/v2/std/single_send',
        json: true,
        body: Mapi,
      }
      request.post(options, (err, response, body) => {
        // console.log(req);
        // console.log(res);
        console.log(body)
        console.log(Mapi.content)
        if (err) {
          console.log(err)
        }
        res.status(200).send(String(newCode))
      })
    }
    // 老版本校验规则
    // Mapi.mobile = phoneNum
    // Mapi.content = `验证码：${authCode}，打死都不要告诉别人哦！`
    // // 将Mapi.content内容转为GBK明文格式
    // Mapi.content = encodeGBK(Mapi.content)
    // const options = {
    //   url: 'http://api01.monyun.cn:7901/sms/v2/std/single_send',
    //   json: true,
    //   body: Mapi,
    // }
    // console.log(Mapi)
    // request.post(options, (err, res, body) => {
    //   // console.log(req);
    //   // console.log(res);
    //   console.log(body)
    //   console.log(Mapi.content)
    //   if (err) {
    //     console.log(err)
    //   }
    // })
  } catch (error) {
    console.log(error)
  }
  // res.status(200).send(newCode)
})

router.get('/query', async (req, res, next) => {
  try {
    userInfo = req.query
    console.log(userInfo)
    const user = await User.findOne({
      where: {
        stuNum: userInfo.stuNum,
        name: userInfo.name
      }
    })
    console.log(user)
    res.send(user)
  } catch (error) {
    console.log(error)
    res.status(500).send('查询失败')
  }
})

router.post('/draw', async (req, res, next) => {
  // 抽奖逻辑函数
  try {
    // 回传的数据
    let data = {
      // 剩余抽奖次数
      remain: 0,
      // 抽奖结果
      result: {
        // 奖品名称
        name: '',
        // 奖品级别
        level: ''
      }
    }
    // test
    // console.log(req)
    // res.status(200).send(data)
    // 获取用户信息
    userInfo = req.body.params
    console.log(userInfo)
    // 查询数据库中是否有该用户
    const user = await User.findOne({
      where: {
        stuNum: userInfo.stuNum,
        name: userInfo.name
      }
    })
    console.log(user)
    // 如果没有该用户，返回错误信息
    if (!user) {
      res.status(500).send('用户不存在')
    } else {
      // 如果有该用户，判断剩余抽奖次数
      if (user.qualified === 0) {
        data.remain = -1
        res.status(200).send(data)
      } else {
        // 判断是否还有奖品
        const price = await Draw.findOne({
          where: {
            id: 1
          }
        })
        if (price.remain === 0) {
          // 未中奖
          data.remain = user.qualified - 1
          data.result.name = '小零食'
          data.result.level = '感谢参与'
          res.status(200).send(data)
        }
        // 抽奖，中奖概率为1/20
        const random = Math.floor(Math.random() * 100)
        console.log(random)
        if (random <= 5) {
          // 判断是否还有一等奖
          if (price.first === 0) {
            // 中二等奖
            data.remain = user.qualified - 1
            data.result.name = '便携小风扇'
            data.result.level = '二等奖'
            // 更新数据库
            await User.update({
              qualified: user.qualified - 1
            }, {
              where: {
                stuNum: userInfo.stuNum,
                name: userInfo.name
              }
            })
            await Draw.update({
              second: price.second - 1,
              remain: price.remain - 1
            }, {
              where: {
                id: 1
              }
            })
            res.status(200).send(data)
          } else {
            // 中一等奖
            data.remain = user.qualified - 1
            data.result.name = '筋膜枪或电熨斗任选'
            data.result.level = '一等奖'
            // 更新数据库
            await User.update({
              qualified: user.qualified - 1
            }, {
              where: {
                stuNum: userInfo.stuNum,
                name: userInfo.name
              }
            })
            await Draw.update({
              first: price.first - 1,
              remain: price.remain - 1
            }, {
              where: {
                id: 1
              }
            })
            res.status(200).send(data)
          }
          // 奖品总数-1
          await Draw.update({
            remain: price.remain - 1
          }, {
            where: {
              id: 1
            }
          })
        } else {
          // 未中奖
          data.result.name = '小零食'
          data.result.level = '感谢参与'
          data.remain = user.qualified - 1
          // 更新数据库
          await User.update({
            qualified: user.qualified - 1
          }, {
            where: {
              stuNum: userInfo.stuNum,
              name: userInfo.name
            }
          })
        }
        
      }
    }
    res.status(200).send(data)
  } catch (err) {
    console.log(err)
  }
})

module.exports = router
