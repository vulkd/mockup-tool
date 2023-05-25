
// Draws a white rectangle with a black border around it
drawRectWithBorder = function(x, y, sideLength, ctx) {
  ctx.save();
  ctx.fillStyle = "#000000";
  ctx.fillRect(x - (sideLength / 2), y - (sideLength / 2), sideLength, sideLength);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(x - ((sideLength - 1) / 2), y - ((sideLength - 1) / 2), sideLength - 1, sideLength - 1);
  ctx.restore();
};

// checks if two points are close enough to each other depending on the closeEnough param
function checkCloseEnough(p1, p2, closeEnough) {
  return Math.abs(p1 - p2) < closeEnough;
}

function Shape(x, y, w, h, fill) {
  this.x = x || 0;
  this.y = y || 0;
  this.w = w || 1;
  this.h = h || 1;
  this.skewX = 0;
  this.skewY = 0;
  this.fill = fill || '#AAAAAA';
  this.selected = false;
  this.closeEnough = 10;
}

Shape.prototype.draw = function(ctx) {
	var locx = this.x;
    var locy = this.y;
	var width = this.w;
    var height = this.h;
    var skewX = this.skewX;
    var skewY = this.skewY;
    var imgNew = new Image();
    imgNew.onload = function(){
        ctx.save();
		ctx.transform(1, skewX/100, skewY/100, 1, 0, 0);
        ctx.drawImage(imgNew, locx, locy, width, height);
        ctx.restore();
    }

    imgNew.src = "https://source.unsplash.com/561igiTyvSk/1600x900";

  if (this.selected === true) {
    this.drawHandles(ctx);
  }
};

// Draw handles for resizing the Shape
Shape.prototype.drawHandles = function(ctx) {
  drawRectWithBorder(this.x, this.y, this.closeEnough, ctx);
  drawRectWithBorder(this.x + this.w, this.y, this.closeEnough, ctx);
  drawRectWithBorder(this.x + this.w, this.y + this.h, this.closeEnough, ctx);
  drawRectWithBorder(this.x, this.y + this.h, this.closeEnough, ctx);
};

// Determine if a point is inside the shape's bounds
Shape.prototype.contains = function(mx, my) {
  if (this.touchedAtHandles(mx, my) === true) {
    return true;
  }
  var xBool = false;
  var yBool = false;
  // All we have to do is make sure the Mouse X,Y fall in the area between
  // the shape's X and (X + Width) and its Y and (Y + Height)
  if (this.w >= 0) {
    xBool = (this.x <= mx) && (this.x + this.w >= mx);
  } else {
    xBool = (this.x >= mx) && (this.x + this.w <= mx);
  }
  if (this.h >= 0) {
    yBool = (this.y <= my) && (this.y + this.h >= my);
  } else {
    yBool = (this.y >= my) && (this.y + this.h <= my);
  }
  return (xBool && yBool);
};

// Determine if a point is inside the shape's handles
Shape.prototype.touchedAtHandles = function(mx, my) {
  // 1. top left handle
  if (checkCloseEnough(mx, this.x, this.closeEnough) && checkCloseEnough(my, this.y, this.closeEnough)) {
    return true;
  }
  // 2. top right handle
  else if (checkCloseEnough(mx, this.x + this.w, this.closeEnough) && checkCloseEnough(my, this.y, this.closeEnough)) {
    return true;
  }
  // 3. bottom left handle
  else if (checkCloseEnough(mx, this.x, this.closeEnough) && checkCloseEnough(my, this.y + this.h, this.closeEnough)) {
    return true;
  }
  // 4. bottom right handle
  else if (checkCloseEnough(mx, this.x + this.w, this.closeEnough) && checkCloseEnough(my, this.y + this.h, this.closeEnough)) {
    return true;
  }
};

module.exports = {
	Shape
};
