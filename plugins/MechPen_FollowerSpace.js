//=============================================================================
// MechPen Plugins - Followers Follow Less Close.
// MechPen_FollowerSpace.js
//=============================================================================

//It's important that this goes before anything otehr plug-in that modifies:
// Game_Follower.updateMove();

var Imported = Imported || {};
Imported.MechPen_FollowerSpace = true;

var MechPen = MechPen || {};
MechPen.FollowerSpace = MechPen.FollowerSpace || {};
MechPen.FollowerSpace.version = 1.3;

//=============================================================================
 /*:
 * @target MV MZ
 * @plugindesc v1.2 Lets party followers lag a set number of tiles behind. 
 * Useful if your character sprites are large (or fat :P ).
 * @author MechPen
 *
 * @param Follower Distance
 * @desc How many tiles are between each character.
 * Default: 1
 * @default 1
 *
 * @param Events move through followers
 * @type boolean
 * @desc If ON events will move through followers.
 * Default: off
 * @default false
 *
 * @help
 * Be sure to put this plug-in above any other plug-in that
 * modifies Game_Follower.updateMove(); or else that plug-in might not work.
 * 
 * Also: You can't set Follower Distance less than 1. It would make no sense to stack
 * the followers like that!
 * version 1.3
 * - Added an option to let events walk through followers. In case they block your
 *   cutscene by being too spaced.
 * version 1.2
 * - Now it works in MZ.
 * version 1.1
 * - Fixed bug with Gathering, if the player hadn't walked enough to fill out his last positions.
 * version 1.0
 * - Finished plugin!
 */
//=============================================================================

MechPen.Parameters = PluginManager.parameters('MechPen_FollowerSpace');
MechPen.Param = MechPen.Param || {};
MechPen.Param.FollowerSpaceDistance = Math.max((Number(MechPen.Parameters['Follower Distance']) || 1), 1);
MechPen.Param.WalkThroughFollower = MechPen.Parameters['Events move through followers'] == true;

//=============================================================================
// Game_Player
//=============================================================================
MechPen.FollowerSpace.Game_Player_initialize = Game_Player.prototype.initialize;
Game_Player.prototype.initialize = function() {
    MechPen.FollowerSpace.Game_Player_initialize.call(this);
    this._lastPositions = new Array();
};

MechPen.FollowerSpace.Game_Player_clearTransferInfo = Game_Player.prototype.clearTransferInfo;
Game_Player.prototype.clearTransferInfo = function() {
    MechPen.FollowerSpace.Game_Player_clearTransferInfo.call(this);
	this.clearLastPositions();
};

Game_Player.prototype.getLastPositions = function() {
	return this._lastPositions;
};

Game_Player.prototype.popLastPositions = function() {
	this._lastPositions.pop();
};

Game_Player.prototype.clearLastPositions = function() {
	this._lastPositions.length = 0;
};

Game_Player.prototype.repeatLastPositions = function() {
	var currentPosition = [this.x, this.y];
	this._lastPositions.unshift(currentPosition)
};

MechPen.FollowerSpace.Game_Player_moveStraight = Game_Player.prototype.moveStraight;
Game_Player.prototype.moveStraight = function(d) {
    MechPen.FollowerSpace.Game_Player_moveStraight.call(this, d);
	if (this.isMovementSucceeded()) {
		var currentPosition = [this.x, this.y];
		this._lastPositions.unshift(currentPosition);
	}
};

MechPen.FollowerSpace.Game_Player_moveDiagonally = Game_Player.prototype.moveDiagonally;
Game_Player.prototype.moveDiagonally = function(horz, vert) {
    MechPen.FollowerSpace.Game_Player_moveDiagonally.call(this, horz, vert);
	if (this.isMovementSucceeded()) {
		var currentPosition = [this.x, this.y];
		this._lastPositions.unshift(currentPosition);
	}
};

if (MechPen.Param.WalkThroughFollower) {
	Game_Player.prototype.isCollided = function(x, y) {
    if (this.isThrough()) {
        return false;
    } else {
        return this.pos(x, y);
    }
};
}

};

//=============================================================================
// Game_Follower
//=============================================================================
Game_Follower.prototype.chasePlayerAtDistance = function(character, distance) {
	var spacesAway = distance;
	var spaces = $gamePlayer.getLastPositions();
	if (spaces.length < spacesAway) { return; }
	
    var sx = this.deltaXFrom(spaces[spacesAway - 1][0]);
    var sy = this.deltaYFrom(spaces[spacesAway - 1][1]);
	//TODO: reoptimize.
    if (Math.abs(sx) > 0 && Math.abs(sy) > 0) {
        this.moveDiagonally(sx > 0 ? 4 : 6, sy > 0 ? 8 : 2);
    } else if (Math.abs(sx) > 0) {
        this.moveStraight(sx > 0 ? 4 : 6);
    } else if (Math.abs(sy) > 0) {
        this.moveStraight(sy > 0 ? 8 : 2);
    }
    this.setMoveSpeed($gamePlayer.realMoveSpeed());
};


//=============================================================================
// Game_Followers
//=============================================================================
Game_Followers.prototype.updateMove = function() {
	var spacing = 0;
	for (var i = 0; i < this._data.length; i++) {
        var precedingCharacter = (i > 0 ? this._data[i - 1] : $gamePlayer);
		spacing += MechPen.Param.FollowerSpaceDistance;
        this._data[i].chasePlayerAtDistance(precedingCharacter, spacing);
    }
	
	if ($gamePlayer.getLastPositions().length - 1 > spacing * (this._data[this._data.length - 1]._memberIndex + 1))
	{
		$gamePlayer.popLastPositions();
	}
	
	if (this.areGathering())
	{
		$gamePlayer.repeatLastPositions();
	}
};

MechPen.FollowerSpace.Game_Followers_jumpAll = Game_Followers.prototype.jumpAll;
Game_Followers.prototype.jumpAll = function() {
	MechPen.FollowerSpace.Game_Followers_jumpAll.call(this);
	$gamePlayer.clearLastPositions();
};

if (Utils.RPGMAKER_NAME == "MZ")
{

Game_Followers.prototype.synchronize = function(x, y, d) {
    for (const follower of this._data) {
        follower.locate(x, y);
        follower.setDirection(d);
    }
};

} else if (Utils.RPGMAKER_NAME == "MV")
{
	
Game_Followers.prototype.synchronize = function(x, y, d) {
    this.forEach(function(follower) {
        follower.locate(x, y);
        follower.setDirection(d);
    }, this);
};

}
