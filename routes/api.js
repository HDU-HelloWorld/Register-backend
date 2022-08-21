var express = require('express');
var router = express.Router();
const { Sequelize, DataTypes, Model } = require('sequelize');

// 连接postgres数据库
const sequelize = new Sequelize('register-hw', 'helloworld', 'hw2022', {
  host: 'localhost',
  dialect: 'postgres',
});
class User extends Model {}


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
}, { sequelize, modelName: 'NewMember' });
User.sync({ alter: true })

/* GET home page. */
router.get('/', async function(req, res, next) {
  try {
    await sequelize.authenticate();
    console.log('数据库成功连接.');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
  res.send('api index');
});

router.post('/register', async function(req, res, next) {
  console.log('收到数据')
  let formData = req.body;
  console.log(formData);
  try {
    // 将传入的数据写入数据库
    const form = await User.create(formData);
    console.log(form.toJSON());
    res.send('报名表提交成功！')
  } catch (error) {
    console.log(error.parent);
    let errorMsg = {
      msg: error.parent.detail,
      name: error.name
    }
    console.log(errorMsg);
    res.send(errorMsg, 500);
  }
});

module.exports = router;
