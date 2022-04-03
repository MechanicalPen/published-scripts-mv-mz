//========================================
// TF_SharpFont.js
// Version :0.1.2.0
// For : RPGツクールMZ (RPG Maker MZ)
// -----------------------------------------------
// Copyright : Tobishima-Factory 2021
// Website : http://tonbi.jp
//
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
//========================================
/*:ja
 * @target MZ
 * @plugindesc フォントのスムージング機能を調整
 * @author とんび﹫鳶嶋工房(tonbi.jp)
 * @url https://github.com/tonbijp/RPGMakerMZ/blob/master/TF_SharpFont.js
 * @base PluginCommonBase
 * @orderAfter PluginCommonBase
 *
 * @param baseFontSize @text 基本フォントサイズ
 * @desc このサイズと倍数を基本フォントとする
 * 0 だと基本フォント用の処理はしない
 * @type number @default 16
 *
 * @param baseThreshold @text 基本フォントの閾値
 * @desc α値がこの値以下なら透明にする
 * 低い値ほど薄い部分も不透明に変換される
 * @type number @default 250
 * @max 255
 *
 * @param isApplyAll @text 全てシャープネス
 * @desc 全てのサイズのフォントに処理を加えるか
 * @type boolean @default true
 * @on 全てに適用(規定) @off 基本フォントのみ
 *
 * @param threshold @text フォントの閾値
 * @desc α値がこの値以下なら透明にする
 * 低い値ほど薄い部分も不透明に変換される
 * @type number @default 200
 * @max 255
 *
 * @param sharpness @text シャープ度(%)
 * @desc 値が大きいほどくっきりする
 * 規定値:50
 * @type number @default 50
 * @min 0 @max 100
 *
 * @================================================
 * @help
 * 特にドット系のフォントがスムージング機能によりボケてしまうのを防ぎます。
 * 
 * [基本フォントサイズ]はフォントが想定しているサイズを入力します。
 * そのサイズのフォントはスムージング(アンチエイリアス)がかかりません。
 * 
 * フォントのスムージングはブラウザやOSの機能に依存するので、
 * あまり神経質に値を調整しても意味がありませんので、ご注意ください。
 * たぶん[基本フォントサイズ]以外は規定値で問題ないと思います。
 * 
 * また機種によっては動作が遅くなる可能性があります。
 * 特にコマンドウィンドウの開閉で遅くなるようです。
 * 
 * テスト用のフォントには、マルモニカ(© 2018-2021 hicc 患者長ひっく)を使用。
 * https://00ff.booth.pm/items/2958237
 *
 * 利用規約: MITライセンス
 */
/*:en
 * @target MZ
 * @plugindesc Adjusted font smoothing function 
 * @author Tonbi ﹫ Tobishima Kobo (tonbi.jp)
 * @url https://github.com/tonbijp/RPGMakerMZ/blob/master/TF_SharpFont.js
 *
 * @param baseFontSize @text Basic font size 
 * @desc This size and multiples are the basic fonts 
 * If 0, the processing for the basic font is not performed. 
 * @type number @default 16
 *
 * @param baseThreshold @text Basic font threshold 
 * @desc If the α value is less than this value, make it transparent 
 * The lower the value, the thinner the part will be converted to opaque. 
 * @type number @default 250
 * @max 255
 *
 * @param isApplyAll @text All sharpness 
 * @desc Do you want to process fonts of all sizes? 
 * @type boolean @default true
 * @on Applicable to all (default)  @off Basic font only 
 *
 * @param threshold @text Font threshold 
 * @desc If the α value is less than this value, make it transparent
 * The lower the value, the thinner the part will be converted to opaque. 
 * @type number @default 200
 * @max 255
 *
 * @param sharpness @text Sharpness (%) 
 * @desc The higher the value, the clearer 
 * The higher the value, the clearer :50
 * @type number @default 50
 * @min 0 @max 100
 *
 * @================================================
 * @help
 * In particular, it prevents dot fonts from being blurred by the smoothing function.
 * 
 * For [Basic font size], enter the size that the font expects.
 * Fonts of that size are not smoothed (antialiased).
 * 
 * Font smoothing depends on browser and OS features, so
 * Please note that it does not make sense to adjust the value too nervously.
 * I think that there is no problem with the default values other than [Basic font size].
 * 
 * Also, depending on the model, the operation may be slow.
 * Especially when opening and closing the command window, it seems to be slow.
 * 
 * Marmonica (© 2018-2021 hicc patient length) is used as the test font.
 * https://00ff.booth.pm/items/2958237
 * 
 * Terms of Use: MIT License 
 */
( () => {
    "use strict";
    const PLUGIN_NAME = "TF_SharpFont";
    const workBitmap = new Bitmap( 1, 1 );
    const wCtx = workBitmap.context;

    // パラメータを受け取る
    const pluginParams = PluginManager.parameters('TF_SharpFont');

    const baseFontSize = pluginParams.baseFontSize;
    const baseThreshold = pluginParams.baseThreshold;
    const isApplyAll = pluginParams.isApplyAll;
    const threshold = pluginParams.threshold;
    const sharpness = ( 100 - pluginParams.sharpness ) / 100;

    const POSITION_LEFT = "left";
    const POSITION_CENTER = "center";
    const POSITION_RIGHT = "right";


    /*--- Bitmap ---*/
    const _Bitmap__drawTextBody = Bitmap.prototype._drawTextBody;
    Bitmap.prototype._drawTextBody = function( text, tx, ty, maxWidth ) {
        const isBaseSize = ( baseFontSize !== 0 ) && this.fontSize % baseFontSize === 0;
        if( !isApplyAll && !isBaseSize || 2048 < maxWidth ) return _Bitmap__drawTextBody.apply( this, arguments );

        //textBaseline = "alphabetic"だとラインの下に出る部分があるのでそのぶん増やす
        const size = Math.floor( this.fontSize * 2 );

        workBitmap.clear();
        workBitmap.resize( maxWidth, size );
        const tCtx = this.context;

        // Copy the drawing destination settings to the workplace 
        wCtx.font = tCtx.font;
        wCtx.textAlign = tCtx.textAlign;
        wCtx.textBaseline = wCtx.textBaseline;// "alphabetic"決め打ちで処理してるけど一応コピー
        wCtx.globalAlpha = tCtx.globalAlpha;
        wCtx.fillStyle = this.textColor;

        // textAlignで、描画位置が変わるのでズレを設定
        let alignX = 0;
        if( wCtx.textAlign === POSITION_RIGHT ) {
            alignX = maxWidth;
        } else if( wCtx.textAlign === POSITION_CENTER ) {
            alignX = Math.round( maxWidth / 2 );
        }
        wCtx.fillText( text, alignX, this.fontSize, maxWidth );
        const data = wCtx.getImageData( 0, 0, maxWidth, size ).data;

        // Convert pixels containing translucency to transparent 
        const l = data.length;
        if( isBaseSize ) {  // 基本サイズ
            for( let i = 0; i < l; i += 4 ) {
                const alpha = data[ i + 3 ];
                data[ i + 3 ] = ( alpha < baseThreshold ) ? 0 : 255;
            }

        } else {    // 基本サイズ以外
            for( let i = 0; i < l; i += 4 ) {
                const alpha = data[ i + 3 ];
                data[ i + 3 ] = ( alpha < threshold ) ? alpha * sharpness : 255;
            }
        }
        wCtx.putImageData( new ImageData( data, maxWidth ), 0, 0 );
        // Directly doing this.context.putImageData () erases the outline 
        // So I put it back in workBitmap and then copied it with blt () 
        this.blt( workBitmap, 0, 0, maxWidth, size, tx - alignX, ty - this.fontSize );
    };
} )();