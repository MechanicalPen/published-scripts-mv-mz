//=============================================================================
// MechPen_SharpText.js
//=============================================================================
/*:
* @target MV MZ
* @plugindesc v0.96 Text Sharpen plugin beta
* @author MechPen
*
* @param outlineSharp
* @desc Select Blurry Outline to give a more shadowy appearance.
* @text Sharpen Text Outline?
* @type boolean
* @on Sharp Outline
* @off Blurry Outline
* @default true
*
* @param textThickness
* @desc Controls how wide the characters will be. 1; full width. 0; thinnest.
* @text Text Thickness
* @type number
* @max 1
* @min 0
* @decimals 2
* @default 0.48
*
* @help MechPen_SharpText.js
*
* This plugin draws text to an offscreen bitmap and manipulates the pixels
* to remove anti-aliasing. Useful for small text or pixelated fonts.
*
* It's based on the lovely github.com/rpgtkoolmv/corescript
* function to draw small text. Thanks for the inspriation!
*
*-----------------------------------------------------------------------------
* How to use this plugin
*-----------------------------------------------------------------------------
* Simply install to your plugins folder and turn it on in the Plugin Manager.
* This plugin should almost certainly go at the top of the list;
* we are changing how the base engine peforms a DrawText function.
*
*-----------------------------------------------------------------------------
* About the license of this plugin (License)
*-----------------------------------------------------------------------------
* This plugin is released under the MIT License.
*
*-----------------------------------------------------------------------------
* The released versions of this plugin (Change log)
*-----------------------------------------------------------------------------
* version 0.96
*  - Fix font being drawn at fractional pixel when centering text.
* version 0.94
*  - MV support, round pixels, outline AA option.
* version 0.9
* - Basic functionality completed.
*   * complain about performance, text not looking right, etc.
*/

(() => {

var params = PluginManager.parameters('MechPen_SharpText');
var SharpText_OutlineAA = params['outlineSharp'] === "true";
var TextSharp_LineWeight = 1.0 - parseFloat(params['textThickness']);
	
Bitmap.minFontSize = 64;
Bitmap.drawSmallTextBitmap = new Bitmap(1024, 64);
/**
 * Draws text to a scratch Bitmap to clear AA, then blts it to this Bitmap.
 *
 * @method drawText
 * @param {String} text The text that will be drawn
 * @param {Number} x The x coordinate for the left of the text
 * @param {Number} y The y coordinate for the top of the text
 * @param {Number} maxWidth The maximum allowed width of the text
 * @param {Number} lineHeight The height of the text line
 * @param {String} align The alignment of the text
 */
Bitmap.prototype.drawText = function(text, x, y, maxWidth, lineHeight, align) {
	// sharp text must be drawn on pixel borders.
	var px = Math.round(x);
	var py = Math.round(y);
	var pmaxWidth = maxWidth || 816;
	pmaxWidth = Math.ceil(pmaxWidth);
	var plineHeight = Math.ceil(lineHeight);
	var poutlineWidth = this.outlineWidth;
	// we'll have performance issues if too many pixels.
	if (this.fontSize > Bitmap.minFontSize) {
		this.drawOldText(text, px, py, pmaxWidth, plineHeight, align);
		return;
    }
    var bitmap = Bitmap.drawSmallTextBitmap;
    bitmap.fontFace = this.fontFace;
    bitmap.fontSize = this.fontSize;
    bitmap.fontItalic = this.fontItalic;
    bitmap.textColor = this.textColor;
    bitmap.outlineColor = this.outlineColor;
    bitmap.outlineWidth = poutlineWidth;
    var height = plineHeight;
    var scaledMaxWidth = pmaxWidth;
    var scaledMaxWidthWithOutline = scaledMaxWidth + poutlineWidth*2;
    var scaledHeight = height;
    var scaledHeightWithOutline = scaledHeight + poutlineWidth*2;

    var bitmapWidth = bitmap.width;
    var bitmapHeight = bitmap.height;
    while (scaledMaxWidthWithOutline > bitmapWidth) bitmapWidth *= 2;
    while (scaledHeightWithOutline > bitmapHeight) bitmapHeight *= 2;
    if (bitmap.width !== bitmapWidth || bitmap.height !== bitmapHeight) bitmap.resize(bitmapWidth, bitmapHeight);
	
	if (this.outlineWidth > 0) {
		// get the outline color
		var c = bitmap.outlineColor;
		var rgb = c.match(/[.?\d]+/g);
		var r = parseInt(rgb[0]);
		var b = parseInt(rgb[1]);
		var g = parseInt(rgb[2]);
		var a = parseFloat(rgb[3])*255;
	
		bitmap.drawNewTextOutline(text, bitmap.outlineWidth, bitmap.outlineWidth, pmaxWidth, height, align);
		if (SharpText_OutlineAA) {
			var imageData = bitmap.getUnbluredImageData(scaledMaxWidthWithOutline, scaledHeightWithOutline, r, g, b, a);
			bitmap._context.putImageData(imageData, 0, 0);
		}
		this.blt(bitmap, 0, 0, scaledMaxWidthWithOutline, scaledHeightWithOutline,
			px-bitmap.outlineWidth, py-bitmap.outlineWidth, scaledMaxWidthWithOutline, scaledHeightWithOutline);
		bitmap.clear();
	}
	
	// get the text color
	var hex = bitmap.textColor;
    var r2 = parseInt(hex.slice(1, 3), 16);
    var g2 = parseInt(hex.slice(3, 5), 16);
    var b2 = parseInt(hex.slice(5, 7), 16);
	var a2 = 255;
	
	bitmap.drawNewTextBody(text, bitmap.outlineWidth, bitmap.outlineWidth, pmaxWidth, height, align);
		var imageData = bitmap.getUnbluredImageData(scaledMaxWidthWithOutline, scaledHeightWithOutline, r2, g2, b2, a2);
		bitmap._context.putImageData(imageData, 0, 0);
    this.blt(bitmap, 0, 0, scaledMaxWidthWithOutline, scaledHeightWithOutline,
        px-bitmap.outlineWidth, py-bitmap.outlineWidth, scaledMaxWidthWithOutline, scaledHeightWithOutline);
    bitmap.clear();
	this._baseTexture.update();
};

Bitmap.prototype.getUnbluredImageData = function(width, height, r, g, b, a) {
	var imageData = this._context.getImageData(0, 0, width, height);
	var data = imageData.data;
	var scaleWithSize = (TextSharp_LineWeight + (TextSharp_LineWeight * 24 / this.fontSize)) / 2;
	var scaleLockSmaller = Math.max(0, Math.min(scaleWithSize, TextSharp_LineWeight));
	var tossCutoff = scaleLockSmaller * a;
	for (var i = 0; i < data.length; i += 4) {
		if(data[i + 3] > 0) // if not transparent
		{
			if (data[i + 3] < tossCutoff) {
				data[i + 3] = 0;  // set alpha
			} else {
				data[i + 3] = a;  // set alpha
			}
			data[i]     = r;     // red
			data[i + 1] = g; // green
			data[i + 2] = b; // blue
		}
			//data[i + 3] = 0;  // set alpha to 0
		//data[i]     = data[i];     // red
		//data[i + 1] = data[i + 1]; // green
		//data[i + 2] = data[i + 2]; // blue
	}
	return imageData;
}

/**
 * Draws the outline text to the bitmap.
 *
 * @param {string} text - The text that will be drawn.
 * @param {number} x - The x coordinate for the left of the text.
 * @param {number} y - The y coordinate for the top of the text.
 * @param {number} maxWidth - The maximum allowed width of the text.
 * @param {number} lineHeight - The height of the text line.
 * @param {string} align - The alignment of the text.
 */
Bitmap.prototype.drawOldText = function(text, x, y, maxWidth, lineHeight, align) {
    // [Note] Different browser makes different rendering with
    //   textBaseline == 'top'. So we use 'alphabetic' here.
    const context = this.context;
    const alpha = context.globalAlpha;
    maxWidth = maxWidth || 0xffffffff;
    let tx = Math.round(x);
    let ty = Math.round(y + lineHeight / 2 + this.fontSize * 0.35);
    if (align === "center") {
        tx += Math.round(maxWidth / 2);
		var wobbly = this.measureTextWidth(text);
		if ((wobbly % 2) == 1) { tx -= 0.5;}
    }
    if (align === "right") {
        tx += maxWidth;
    }
    context.save();
    context.font = this._makeFontNameText();
    context.textAlign = align;
    context.textBaseline = "alphabetic";
    context.globalAlpha = 1;
    this._drawTextOutline(text, tx, ty, maxWidth);
    context.globalAlpha = alpha;
    this._drawTextBody(text, tx, ty, maxWidth);
    context.restore();
    this._baseTexture.update();
};

Bitmap.prototype.drawNewTextOutline = function(text, x, y, maxWidth, lineHeight, align) {
    // [Note] Different browser makes different rendering with
    //   textBaseline == 'top'. So we use 'alphabetic' here.
    const context = this.context;
    maxWidth = maxWidth || 0xffffffff;
    let tx = Math.round(x);
    let ty = Math.round(y + lineHeight / 2 + this.fontSize * 0.35);
    if (align === "center") {
        tx += Math.round(maxWidth / 2);
		var wobbly = this.measureTextWidth(text);
		if ((wobbly % 2) == 1) { tx -= 0.5;}
    }
    if (align === "right") {
        tx += maxWidth;
    }
    context.save();
    context.font = this._makeFontNameText();
    context.textAlign = align;
    context.textBaseline = "alphabetic";
    context.globalAlpha = 1;
    this._drawTextOutline(text, tx, ty, maxWidth);
    context.restore();
    this._baseTexture.update();
};

Bitmap.prototype.drawNewTextBody = function(text, x, y, maxWidth, lineHeight, align) {
    // [Note] Different browser makes different rendering with
    //   textBaseline == 'top'. So we use 'alphabetic' here.
    const context = this.context;
    maxWidth = maxWidth || 0xffffffff;
    let tx = Math.round(x);
    let ty = Math.round(y + lineHeight / 2 + this.fontSize * 0.35);
    if (align === "center") {
        tx += Math.round(maxWidth / 2);
		var wobbly = this.measureTextWidth(text);
		if ((wobbly % 2) == 1) { tx -= 0.5;}
    }
    if (align === "right") {
        tx += maxWidth;
    }
    context.save();
    context.font = this._makeFontNameText();
    context.textAlign = align;
    context.textBaseline = "alphabetic";
    this._drawTextBody(text, tx, ty, maxWidth);
    context.restore();
    this._baseTexture.update();
};
  
})();
// EOF