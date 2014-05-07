/*
 * Document   : de_dieploegers_shortcutHandler.js
 * Created on : 20130711
 * Author     : Dennis Ploeger <develop@dieploegers.de>
 * Description: Zimbra Global Shortcut handler for Zimlets
 */

/**
 * This script enables zimlets to register global shortcut keymaps, so that
 * they are callable from anywhere.
 *
 * It mimics Zimbra's core function of mapping I18N key description to keys.
 *
 * Usage:
 *
 *   * Include this script into your zimlet's xml definition file:
 *     <include>de_dieploegers_shortcutHandler.js</include>
 *   * Add shortcut definitions to your properties file consisting of a
 *     prefix, an actionCode and three keys
 *       * "description" - Description of the key code (currently not used)
 *       * "display" - User-friendly display of the key code (currently not
 *         used)
 *       * "keycode" - Keycode of the shortcut. Consists of an optional
 *         meta-key label ("Shift", "Alt", "Ctrl" or "Meta") and an ASCII-
 *         keycode, separated by "+". So a key "a" with a hold "Shift"-Key
 *         would be "Shift+65"
 *     A complete definition could be:
 *     SHORTCUT.DO_SOMETHING.description = Do something interesting
 *     SHORTCUT.DO_SOMETHING.display = Shift + a
 *     SHORTCUT.DO_SOMETHING.keycode = Shift+65
 *
 *     Please note, that the meta-key label is translated. So for a german
 *     properties file for example, use "Strg" instead of "Ctrl".
 *   * Add a "getKeyMapName" method to your zimlet's handler prototype returning
 *     the prefix of the shortcut definitions in your properties file.
 *     For example:
 *     my_cool_zimlethandler.prototype.getKeyMapName = function () {
 *         return "SHORTCUT";
 *     }
 *   * In your zimlet's handler constructor, create an object of this class
 *     and specify your zimlet's I18N object. It's typically identical to
 *     the name of your zimlet. (for example my_cool_zimlet)
 *     Additionally, specify a callback handler (created from AjxCallback),
 *     that is responsible to carry out the action, if certain keys are
 *     pressed. The callback handler is called with the actioncode
 *     as it's only parameter. It is only called, if an actioncode is found
 *     for the pressed key sequence
 *
 *  Current limitations:
 *
 *    * The class doesn't support fancy sequence keypresses like zimbra uses.
 *      (for example pressing "m" and "r" afterwards to mark messages as read)
 */

/**
 * Instantiate a shortcut handler
 *
 * @param mapping  The key mapping (typically the zimlet's I18N object)
 * @param callback Callback, that is called with the pressed ActionCode
 */

de_dieploegers_shortcutHandler = function (mapping, callback) {

    this.keyMap = new de_dieploegers_universalKeyMap(mapping);
    this.keyMapMgr = new DwtKeyMapMgr(this.keyMap);

    this.callback = callback;

    appCtxt.getKeyboardMgr().addListener(

        DwtEvent.ONKEYUP,
        new AjxListener(
            this,
            this.handleKeyUp
        )

    );

};

de_dieploegers_shortcutHandler.prototype = new Object();
de_dieploegers_shortcutHandler.prototype.constructor =
    de_dieploegers_shortcutHandler;

/**
 * Universal Key handler running a callback with the found actioncode
 *
 * @param ev
 */

de_dieploegers_shortcutHandler.prototype.handleKeyUp = function (ev) {

    var actionCode,
        kev,
        key,
        keyCode,
        keySequence,
        map,
        parts;

    keyCode = DwtKeyEvent.getCharCode(ev);

    kev = DwtShell.keyEvent;
    kev.setFromDhtmlEvent(ev);

    parts = [];

    if (kev.altKey) 	{ parts.push(DwtKeyMap.ALT); }
    if (kev.ctrlKey) 	{ parts.push(DwtKeyMap.CTRL); }
    if (kev.metaKey) 	{ parts.push(DwtKeyMap.META); }
    if (kev.shiftKey) 	{ parts.push(DwtKeyMap.SHIFT); }
    parts.push(keyCode);

    this.keySequence = [parts.join(DwtKeyMap.JOIN)];

    keySequence = this.keySequence;

    this.keySequence = [];

    map = this.keyMap.getMap();

    actionCode = null;

    for (key in map) {

        if (map.hasOwnProperty(key)) {

            if (actionCode === null) {

                actionCode = this.keyMapMgr.getActionCode(keySequence, key);

            }

        }

    }

    if (actionCode !== null) {

        this.callback.run(actionCode);

    }

};

de_dieploegers_universalKeyMap = function (mapping) {

    DwtKeyMap.call(this);

    this._load(
        this._map,
        mapping
    );

};

de_dieploegers_universalKeyMap.prototype = new DwtKeyMap(true);
de_dieploegers_universalKeyMap.prototype.constructor =
    de_dieploegers_universalKeyMap;