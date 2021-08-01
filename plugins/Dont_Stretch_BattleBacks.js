//=============================================================================
// Dont_Stretch_BattleBacks.js
//=============================================================================
/*:
* @target MZ
* @plugindesc v1.0 Don't Stretch Battlebacks
* @author MechPen
*
*
* @help Dont_Stretch_BattleBacks.js
*
* This plugin fixes battlebacks to not stretch out at greater than default
* game resolutions. instead they will be cropped / barred.
*
*
*-----------------------------------------------------------------------------
* How to use this plugin
*-----------------------------------------------------------------------------
* Plug and play.
*
*-----------------------------------------------------------------------------
* About the license of this plugin (License)
*-----------------------------------------------------------------------------
* This plugin is released under the MIT License.
*
*-----------------------------------------------------------------------------
* The released versions of this plugin (Change log)
*-----------------------------------------------------------------------------
* version 1.0
*  - first release
*/

(() => {

Sprite_Battleback.prototype.adjustPosition = function() {
    this.width = this.bitmap.width;
    this.height = this.bitmap.height;
    this.x = (Graphics.width - this.width) / 2;
    if ($gameSystem.isSideView()) {
        this.y = Graphics.height - this.height;
    } else {
        this.y = 0;
    }
    this.scale.x = 1;
    this.scale.y = 1;
};
  
})();
// EOF