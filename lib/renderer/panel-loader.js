'use strict';

/**
 * @module PanelLoader
 */
let PanelLoader = {};
module.exports = PanelLoader;

// requires
const Path = require('fire-path');
const UI = require('./ui');
const JS = require('../share/js-utils');

// ==========================
// exports
// ==========================

function _createPanelFrame ( proto ) {
  let frameEL = document.createElement('ui-panel-frame');
  let template = proto.template;
  let style = proto.style;
  let listeners = proto.listeners;

  // NOTE: do not use delete to change proto, we need to reuse proto since it was cached
  JS.mixinExcept(frameEL, proto, [
    'template', 'style', 'listeners'
  ]);

  if ( template ) {
    let root = frameEL.shadowRoot;
    root.innerHTML = template;

    if ( style ) {
      let styleElement = document.createElement('style');
      styleElement.type = 'text/css';
      styleElement.textContent = style;

      root.insertBefore( styleElement, root.firstChild );
      root.insertBefore(
        UI.DomUtils.createStyleElement('editor-framework://dist/css/elements/panel-frame.css'),
        root.firstChild
      );
    }
  }

  if ( listeners ) {
    for ( let name in listeners ) {
      frameEL.addEventListener(name, listeners[name].bind(frameEL));
    }
  }

  return frameEL;
}

PanelLoader.load = function ( panelID, info, cb ) {
  let entryFile = Path.join( info.path, info.main );

  if ( !info.ui ) {
    UI.ResMgr.importScript(entryFile).then(
      // success
      panelProto => {
        if ( !panelProto ) {
          if ( cb ) {
            cb ( new Error(`Failed to load panel ${panelID}: Can not find panel frame constructor in "UI.PolymerUtils.panels"`) );
          }
          return;
        }

        let frameEL = _createPanelFrame(panelProto);

        if ( cb ) {
          cb ( null, frameEL );
        }
      },

      // error
      err => {
        if ( cb ) {
          cb ( err );
        }
      }
    );
  } else if ( info.ui === 'polymer' ) {
    UI.PolymerUtils.import( entryFile, ( err ) => {
      if ( err ) {
        if ( cb ) {
          cb ( new Error(`Failed to load panel ${panelID}: ${err.message}`) );
        }
        return;
      }

      let ctor = UI.PolymerUtils.panels[panelID];
      if ( !ctor ) {
        if ( cb ) {
          cb ( new Error(`Failed to load panel ${panelID}: Can not find panel frame constructor in "UI.PolymerUtils.panels"`) );
        }
        return;
      }

      let frameEL = new ctor();
      frameEL.classList.add('fit');
      frameEL.tabIndex = 1;

      if ( cb ) {
        cb ( null, frameEL );
      }
    });
  }
};
