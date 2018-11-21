define(function() {

  function EmojiOverlay(elementRegistry, overlays, eventBus) {

    this._overlays = overlays;
    this._elementRegistry = elementRegistry;

    var self = this;

    eventBus.on('canvas.viewbox.changed', function() {
      self._elementRegistry.forEach(function(flowElement) {
        self._overlays.add(flowElement, 'emoji', {
          position: { left:0, top: 0 },
          html: '<span style="font-size:40px">😁</span>'
        });
      });
    });

  }

  return {
    __init__: [ 'emojiOverlay' ],
    'emojiOverlay': [ 'type', EmojiOverlay ]
  };

});