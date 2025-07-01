/*:
@target MZ
@plugindesc v0.4.0 - Use images as Gauges
@author MechPen
@url 
@help
Place an image, Gauge.png into the System folder.
should be 5x1 cells. the top cell is HP, then MP then TP, then time (for active time battle).
the bottom cell is used for the empty part of the gauge.
every gauge should be 85x12
the width of the Gauge.png should be 85
the height of the Gauge.png should be 12x5 = 60
*/
(function () {

var Sprite_Gauge_createBitmap = Sprite_Gauge.prototype.createBitmap;
Sprite_Gauge.prototype.createBitmap = function() {
    Sprite_Gauge_createBitmap.call(this);
	var tempBitmap = ImageManager.loadSystem('Gauges'); // make sure the gauges are loaded
};

Sprite_Gauge.prototype.drawGaugeRect = function(x, y, width, height) {
		const rate = this.gaugeRate();
		let gauge = ImageManager.loadSystem('Gauges'); // should be cached so this is fine
		const sysW = 85; const sysH = this.gaugeHeight();
		let index = 0;
		switch(this._statusType) {
		case "hp":
			index = 0;
			break;
		case "mp":
			index = 1;
			break;
		case "tp":
			index = 2;
			break;
		case "time":
			index = 3;
			break;
		default:
			index = 3;
		}
		//empty
		const pw = sysW;
		const ph = sysH;
		const sx = 0;
		const sy = 4 * ph;
		this.bitmap.blt(gauge, sx, sy, pw, ph, this.bitmapWidth() - sysW, y);
		//full
		const pwf = Math.round(sysW * rate);
		const phf = sysH;
		const sxf = 0;
		const syf = index * ph;
		this.bitmap.blt(gauge, sxf, syf, pwf, phf, this.bitmapWidth() - sysW, y);
};

})();