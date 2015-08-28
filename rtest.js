var stream = require('readable-stream');
var util = require('util');
var Transform = stream.Transform;

function Test(){
  Transform.call(this);
}

util.inherits(Test, Transform);

Test.prototype._transform = function(chunk, enc, cb) {
  this.push(chunk);
  console.log('got chunk');
  cb();
};

var t = new Test();
//t.setEncoding("utf8");
t.write("foo");