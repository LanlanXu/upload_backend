var express = require('express'); // 基于Node.js 的Web 应用程序开发框架
var app = express(); // 起一个应用
const formidable = require("formidable");
const path = require("path");

app.use(express.static("./demo")); // 设置文件的访问

app.all('/upload.do', function (req, res) {
  var action = req.query.action;
  if (action === 'uploadFile') {
    // 上传文件
    res.setHeader('Content-type', 'text/html;charset=utf-8');
    var form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.multiples = true;
    //设置上传文件的大小
    form.maxFileSize = 2000 * 1024 * 1024;
    form.uploadDir = path.join(__dirname, "upload_images");
    form.parse(req, function (err, fields, files) {
      if(!files.file) return res.end(JSON.stringify({
        "state": "FAIL"
      }));
      var url = files.file.path.match(/upload_.+/)[0]
      res.end(JSON.stringify({
        "id": Math.random().toString().slice(2),
        "state": "SUCCESS",
        "url": url,
        "title": files.file.name,
        "size": files.file.size
      }))
    })
  }
});

app.listen(3111); // 创建一个web