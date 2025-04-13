//=============================================================================
// FFBattleUI.js
//=============================================================================
/*:
* @target MZ
* @plugindesc v0.0.1 FF Battle UI
* @author MechPen
* @help FFBattleUI.js
*
* Everything you need to display the battle like popular old RPGs
*
*
* @param enemyWidth
* @text Enemy Window Width
* @desc How wide should the enemy name display window be?
* @default 240
* @type number
* @min 2
*
* @param gaugeWidth
* @text Gauge Sprite Width
* @desc If you need to adjust how wide the gauges are, do it here.
* @default 108
* @type number
* @min 2
*
* @param nameWidth
* @text Name Sprite Width
* @desc Adjust how wide the actor name in battle is.
* @default 128
* @type number
* @min 2
*
*/

(() => {
    const pluginName = "FFBattleUI";
	const pluginParams = PluginManager.parameters(pluginName);
    const ENEMY_WIDTH = Number(pluginParams.enemyWidth);
	const GAUGE_WIDTH = Number(pluginParams.gaugeWidth);
	const NAME_WDTH = Number(pluginParams.nameWidth);
	
	
//// Sprite_Gauge ////
Sprite_Gauge.prototype.bitmapWidth = function() {
    return GAUGE_WIDTH;
};


/// Sprite_Name ///
Sprite_Name.prototype.bitmapWidth = function() {
    return NAME_WDTH;
};


//////// Window_BattleEnemy ///////
Window_BattleEnemy.prototype.maxCols = function() {
    return 1;
};

//////// Window_BattleStatus ////////////

var Window_BattleStatus_initialize = Window_BattleStatus.prototype.initialize;
Window_BattleStatus.prototype.initialize = function(rect) {
	Window_BattleStatus_initialize.call(this, rect);
	this.frameVisible = true;
};

Window_BattleStatus.prototype.maxCols = function() {
    return 1;
};

Window_BattleStatus.prototype.maxRows = function() {
    return 4;
};

Window_BattleStatus.prototype.itemHeight = function() {
    return this.innerHeight / this.maxRows();
};

Window_BattleStatus.prototype.drawItem = function(index) {
    this.drawItemStatus(index);
};

Window_BattleStatus.prototype.nameX = function(rect) {
    return rect.x;
};

Window_BattleStatus.prototype.nameY = function(rect) {
    //return rect.y + this.itemHeight()/2 - this.lineHeight()/2;
	return this.basicGaugesY(rect);
};

Window_BattleStatus.prototype.basicGaugesX = function(rect) {
	const numGauges = 3;
    const aftername = rect.x + rect.width - this.gaugeLineWidth() *(numGauges) - this.extraHeight()*(3);
    return aftername;
};

Window_BattleStatus.prototype.basicGaugesY = function(rect) {
    return rect.y + this.itemHeight()/2 - this.gaugeLineHeight()/2;
};

Window_BattleStatus.prototype.gaugeLineWidth = function(rect) {
    return 108;//(this.innerWidth -  this.extraHeight())/4;
};

Window_BattleStatus.prototype.stateIconX = function(rect) {
	const extraSpace = this.basicGaugesX(rect) - NAME_WDTH;
    return this.basicGaugesX(rect) - Math.floor(extraSpace/2);
};

Window_BattleStatus.prototype.stateIconY = function(rect) {
    return rect.y + this.itemHeight()/2;
};

Window_BattleStatus.prototype.placeBasicGauges = function(actor, x, y) {
	var xPlus = x;
	var yPlus = y;
    this.placeGauge(actor, "hp", xPlus, yPlus);
    this.placeGauge(actor, "mp", xPlus + this.gaugeLineWidth(), yPlus);
    if ($dataSystem.optDisplayTp) {
        this.placeGauge(actor, "tp", xPlus + this.gaugeLineWidth() * 2, yPlus);
    } else if (BattleManager.isTpb()) {
		this.placeGauge(actor, "time", xPlus + this.gaugeLineWidth() * 2, yPlus);
	}
};


////////// Scene_Battle //////////////

Scene_Battle.prototype.statusWindowRect = function() {
    const ww = Graphics.boxWidth - ENEMY_WIDTH;
    const wh = this.windowAreaHeight();
    const wx = Graphics.boxWidth - ww;
    const wy = Graphics.boxHeight - wh;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Battle.prototype.enemyWindowRect = function() {
    const wx = 0;
    const ww = ENEMY_WIDTH;
    const wh = this.statusWindowRect().height;
    const wy = Graphics.boxHeight - wh;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Battle.prototype.partyCommandWindowRect = function() {
    const statusRect = this.statusWindowRect();
	const ww = 192;
    const wh = statusRect.height;
    const wx = this.statusWindowX() - ww;
    const wy = statusRect.y;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Battle.prototype.actorCommandWindowRect = function() {
    const statusRect = this.statusWindowRect();
	const ww = 192;
    const wh = statusRect.height;
    const wx = this.statusWindowX() - ww;
    const wy = statusRect.y;
    return new Rectangle(wx, wy, ww, wh);
};

Scene_Battle.prototype.statusWindowX = function() {
	return Graphics.boxWidth - this.statusWindowRect().width;
};

var Scene_Battle_updateStatusWindowVisibility = Scene_Battle.prototype.updateStatusWindowVisibility;
Scene_Battle.prototype.updateStatusWindowVisibility = function() {
    Scene_Battle_updateStatusWindowVisibility.call(this);
	if ($gameMessage.isBusy()) {
        this._enemyStatusWindow.close();
    } else if (this.shouldOpenStatusWindow()) {
        this._enemyStatusWindow.show();
		this._enemyStatusWindow.open();
		this._enemyStatusWindow.deselect();
    }
};


var Scene_Battle_startEnemySelection = Scene_Battle.prototype.startEnemySelection;
Scene_Battle.prototype.startEnemySelection = function() {
    Scene_Battle_startEnemySelection.call(this);
    this._statusWindow.show();
};

var Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
Scene_Battle.prototype.createAllWindows = function() {
	this.createEnemyStatusWindow();
	Scene_Battle_createAllWindows.call(this);
};

Scene_Battle.prototype.createEnemyStatusWindow = function() {
    const rect = this.enemyWindowRect();
    this._enemyStatusWindow = new Window_BattleEnemy(rect);
	this.addWindow(this._enemyStatusWindow);
};

var Scene_Battle_startPartyCommandSelection = Scene_Battle.prototype.startPartyCommandSelection;
Scene_Battle.prototype.startPartyCommandSelection = function() {
    this._enemyStatusWindow.show();
    this._enemyStatusWindow.open();
	this._enemyStatusWindow.deselect();
	Scene_Battle_startPartyCommandSelection.call(this);
};

var Scene_Battle_endCommandSelection = Scene_Battle.prototype.endCommandSelection;
Scene_Battle.prototype.endCommandSelection = function() {
	Scene_Battle_endCommandSelection.call(this);
	this._enemyStatusWindow.show();
	this._enemyStatusWindow.deselect();
};
 
   
})();


// end of file