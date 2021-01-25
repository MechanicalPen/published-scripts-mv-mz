//=============================================================================
// Rolling_HP_for_MV.js
//=============================================================================
/*:
* @target MV
* @plugindesc Rolling HP plugin
* @author MechPen
*
*
* @param frames
* @desc Every Roll Speed frames, HP will decrease by 1.
* @text Roll Speed.
* @type number
* @max 3600
* @min 1
* @default 4
*
* @help Rolling_HP.js
*
* This plugin gives actors HP that drains over time after taking damage.
* Like the popular Itoi RPG.
*
*-----------------------------------------------------------------------------
* How to use this plugin
*-----------------------------------------------------------------------------
* Simply install to your plugins folder and turn it on in the Plugin Manager.
* Probably not compatible with... well, anything. but you can give it a try.
*
*-----------------------------------------------------------------------------
* About the license of this plugin (License)
*-----------------------------------------------------------------------------
* This plugin is released under the MIT License.
*
*/
(() => {
	
var params = PluginManager.parameters('Rolling_HP_for_MV');
var Roll_Time = parseInt(params['frames']);

// todo : overrider proper like.
var _roll_GameActor_initMembers = Game_Actor.prototype.initMembers;
Game_Actor.prototype.initMembers = function() {
    _roll_GameActor_initMembers.call(this);
	this._staticHp = 1; // new
	this._rollHpTimer = 0;
};

var _roll_GameActor_onBattleStart = Game_Actor.prototype.onBattleStart;
Game_Actor.prototype.onBattleStart = function() {
	_roll_GameActor_onBattleStart.call(this);
	this.initRollingHp(); // new
};

Game_Actor.prototype.initRollingHp = function() {
	this._staticHp = this._hp;
}

Game_Actor.prototype.gainHp = function(value) {
    this._result.hpDamage = -value;
    this._result.hpAffected = true;
	// I think this is how Mother 2 works????
	if (value > 0)
	{
		this._staticHp = this.hp + value;
		this._staticHp.clamp(0, this.mhp);
	} else {
		this._staticHp = this._staticHp + value;
		this._staticHp.clamp(0, this.mhp);
	}
};

Game_Actor.prototype.checkCollapse = function() {
	if (this.hp == 1 && this._staticHp < 1) {
		this.setHp(0);
		this._staticHp = 0;
	}
}

Game_Actor.prototype.rollHp = function() {
	if (this._staticHp > this._hp) {
		// roll up timer
		this._rollHpTimer += 1;
		if (this._rollHpTimer < Roll_Time) { return; }
		this._rollHpTimer = 0;
		this.setHp(this.hp + 1);
	} else if (this._staticHp < this._hp) {
		// roll down timer
		this._rollHpTimer += 1;
		if (this._rollHpTimer < Roll_Time) { return; }
		this._rollHpTimer = 0;
		this.setHp(Math.max(this.hp - 1, 1)); // don't die from rolling.
	}
};

// color stuff.
Window_Base.prototype.hpColor = function(actor) {
    if (actor._staticHp < 1) {
        return this.deathColor();
    } else if (actor.isDying()) {
        return this.crisisColor();
    } else {
        return this.normalColor();
    }
};

Game_Actor.prototype.isDying = function() {
    return this.isAlive() && this._staticHp < this.mhp / 4;
};

var _SceneBattle_updateStatusWindow = Scene_Battle.prototype.updateStatusWindow;
Scene_Battle.prototype.updateStatusWindow = function() {
	_SceneBattle_updateStatusWindow.call(this);
	BattleManager.updateHP(); // todo maybe find a better place for this.
};

BattleManager.updateHP = function() {
	if (this._phase != 'init' && (!$gameMessage.isBusy() ||
		!this.updateEvent()) && !$gameTroop.isAllDead()) {
		$gameParty.allMembers().forEach(function(actor) {
			actor.rollHp();
		});
		this._statusWindow.refresh();
	}
};

var _roll_BattleManager_updateTurnEnd = BattleManager.updateTurnEnd;
BattleManager.updateTurnEnd = function() {
    $gameParty.allMembers().forEach(function(actor) {
			actor.checkCollapse();
	});
	_roll_BattleManager_updateTurnEnd.call(this);
};

// override
BattleManager.checkBattleEnd = function() {
    if (this._phase != 'action') {
        if (this.checkAbort()) {
            return true;
        } else if ($gameTroop.isAllDead()) {
            this.processVictory();
            return true;
        } else if ($gameParty.isAllDead()) {
            this.processDefeat();
            return true;
        }
    }
    return false;
};

Game_Troop.prototype.isAllNoHp = function() {
	return this.members().filter(function(member) {
        return member.hp > 0;
    }).length == 0;
}

})();
// EOF