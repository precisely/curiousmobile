define(function(require, exports, module) {
    'use strict';
    var View = require('famous/core/View');
    var Surface = require('famous/core/Surface');
    var Transform = require('famous/core/Transform');
    var StateModifier = require('famous/modifiers/StateModifier');
    var Modifier = require('famous/core/Modifier');
    var InputSurface = require('famous/surfaces/InputSurface');
    var FastClick = require('famous/inputs/FastClick');
    var RenderNode = require("famous/core/RenderNode");
    var StateView = require('views/StateView');
    var ContainerSurface = require('famous/surfaces/ContainerSurface');
    var Surface = require('famous/core/Surface');
    var UpdateAvatarTemplate = require('text!templates/update-avatar.html');
    var User = require('models/User');
    var u = require('util/Utils');

    function UpdateAvatarView() {
        StateView.apply(this, arguments);
        _createSurface.call(this);
    }

    UpdateAvatarView.prototype = Object.create(StateView.prototype);
    UpdateAvatarView.prototype.constructor = UpdateAvatarView;

    UpdateAvatarView.DEFAULT_OPTIONS = {
    };

    function _createSurface() {
        var formContainerSurface = new Surface({
            size: [undefined, App.height-114],
            content: _.template(UpdateAvatarTemplate, templateSettings),
            properties: {
                background: 'rgba(123, 120, 120, 0.48)'
            }
        });

        var mod = new StateModifier({
            transform: Transform.translate(0, 0, 99)
        });

        formContainerSurface.on('click', function(e) {
            var classList;
            if (u.isAndroid() || (e instanceof CustomEvent)) {
                classList = e.srcElement.classList;
                $('#image-cropper').cropit({
                    imageBackground: true
                });

                if (_.contains(classList, 'export')) {
                    var imageData = $('#image-cropper').cropit('export');
                    if (!imageData) {
                        console.log('Please choose a file to upload.');
                        return;
                    }
                    //$('#avatarModal .export').hide()
                    //$('#avatarModal .wait-form-submit').show()
                    var blob = dataURItoBlob(imageData);

                    //var tagName = $('#tagName').serializeObject();
                    //var formData = new FormData();
                    //formData.append("avatar", blob, "avatar.png");
                    //formData.append(App.CSRF.SyncTokenKeyName, App.CSRF.updateAvatarCSRF);
                    //formData.append(App.CSRF.SyncTokenUriName, 'updateAvatarCSRF');

                    /* var formData = $('#saveAvatar').serializeObject();
                     formData.avatar = blob;*/
                    var formData = new FormData();
                    formData.append("avatar", blob, "avatar.png");
                    User.saveAvatar(formData, function () {
                        console.log('********************** profile picture updated ***********************************');
                    });
                }
            }
        }.bind(this));


        this.add(mod).add(formContainerSurface);
    }

    module.exports = UpdateAvatarView;
});
