
(function () {
    function IUploader(options) {
        options = options ? options : {};
        for (key in options) {
            this[key] = options[key];
        }
        this.store = {};
        this._createInputObj();
        // 判断是否是ie9
        this.isIE9 = !$('.iu-file')[0].files;

        this._initEvent();
    }
    IUploader.prototype = {
        /**
         * 主要是添加上传的一些限制
         * can do something......：可以修改提示语，及将alert更换为项目中的提示方法
         * @param {文件对象} file 
         * @returns bool 条件是否正确
         */
        beforeUpload: function (file) {
            var types = this.accept ? this.accept.extensions.split(',') : [];

            if (types.length && types.indexOf(file.ext.toLowerCase()) === -1) {
                alert('当前只支持上传' + types.join('、'));
                return false;
            }
            // 非ie9的时候，前端可做大小限制；ie9中只能后台做限制
            if (!this.isIE9) {
                if (file.size === 0) {
                    alert('不得上传空文件');
                    return false;
                }
                if (this.fileSingleSizeLimit && file.size > this.fileSingleSizeLimit) {
                    alert('文件不得大于' + this._bytesToSize(this.fileSingleSizeLimit));
                    return false;
                }
            }

            return true;
        },
        /**
         * 新增展示的上传文件
         * @param {文件对象} file 
         */
        appendListItem: function (file) {
            var canDelete = this.canDelete,
                $li = $(
                    '<li id="file-' + file.id + '">' +
                    '<h3 title="' + file.name + '" class="' + (canDelete ? 'wid-80' : '') + '">' + file.name + '</h3>' +
                    '<div class="iu-des">' +
                    '<span class="iu-size">' + (this.isIE9 ? '' : this._bytesToSize(file.size)) + '</span>' +
                    '<span class="iu-status iu-uploading">正在上传</span>' +
                    '</div>' +
                    '<span class="iu-delete hide" data-id="' + file.id + '"></span>' +
                    '</li>'
                );

            this.$list.append($li);
        },
        /**
         * 修改接口路径
         * @param {接口路径} api 
         */
        changeServer: function (api) {
            this.$picker.find('form').attr('action', api);
        },
        /**
         * 上传回显的文件
         * @param {文件对象} file 
         */
        appendUploadedFile: function(file){
            var canDelete = this.canDelete,
                $li = $(
                    '<li id="file-' + file.id + '">' +
                    '<h3 title="' + file.name + '" class="' + (canDelete ? 'wid-80' : '') + '">' + file.name + '</h3>' +
                    '<div class="iu-des">' +
                    '<span class="iu-size">' + (this.isIE9 ? '' : this._bytesToSize(file.size)) + '</span>' +
                    '<span class="iu-status iu-finish">上传完成</span>' +
                    '</div>' +
                    '<span class="iu-delete ' + (this.canDelete ? '' : 'hide') + '" data-id="' + file.id + '"></span>' +
                    '</li>'
                );
            this.store[file.id] = file;
            this.$list.append($li);
            this._checkNum();
        },
        /**
         * 删除展示的文件
         * @param {展示文件id} id 
         */
        deleteItem: function (id) {
            $('#file-' + id).remove();
            delete this.store[id];
            this._checkNum();
        },
        /**
         * 上传完成
         * @param {事件对象} e 
         */
        upComplete: function (e) {
            var iframeName = $(e).attr('name'),
                doc = document.getElementById(iframeName).contentDocument || document.frames[iframeName].document,
                res = doc.body.innerHTML;

            if (!res) return;

            var input = $('[data-id=' + iframeName + ']'),
                wrap = $('[wrap-id=' + iframeName + ']'),
                fileObj = this._getFile(input[0]);

            wrap.removeClass('hide choose').addClass('new');

            try {
                this.upSuccess(fileObj, JSON.parse(res));
            } catch (error) {
                this.upError(fileObj, res);
            }

            // 清空input中的文件
            input.val('');
            if (this.isIE9) {
                var cf = input.clone();
                input.remove();
                cf.appendTo("form[target=" + iframeName + ']');
            }
        },
        /**
         * 上传成功回调函数
         * can do something......：可以加一下其他操作
         * @param {文件对象} file 
         * @param {接口返回对象} response 
         */
        upSuccess: function (file, response) {
            var $li = $('#file-' + file.id),
                canDelete = this.canDelete;

            if (this.successOption(response)) {
                if (this.isIE9) $li.find('.iu-size').html(this._bytesToSize(response.size));
                $li.find('.iu-status').removeClass('iu-uploading').addClass('iu-finish').html('上传完成');
                if (canDelete) $li.find('.iu-delete').removeClass('hide');

                // 修改id，将掉文件以前的id全部替换为接口返回的附件的id
                $li.find('.iu-delete').attr('data-id', response.id);
                $li.attr('id', 'file-' + response.id);
                this.store[response.id] = response;
            } else {
                this._removeListItem(file);
            }
            if (this.uploadCallback) this.uploadCallback(response);

        },
        /**
         * 上传失败回调函数
         * @param {文件对象} file 
         * @param {失败信息} response 
         */
        upError: function (file, response) {
            this._removeListItem(file);
            // can do something......
            if (this.errorCallback) this.errorCallback(response);
        },
        /**
         * 上传失败后自动移除
         * @param {文件对象} file 
         */
        _removeListItem: function (file) {
            var $li = $('#file-' + file.id);

            $li.find('.iu-status').removeClass('iu-uploading').addClass('iu-fail').html('上传失败');

            setTimeout(function () {
                $li && $li.remove();
            }, 1000);
        },
        /**
         * 初始化事件绑定
         */
        _initEvent: function () {
            var _this = this;
            this.$picker.on("change", ".iu-file", function (e) {
                var fileObj = _this._getFile(e.target), inputId = $(this).attr('data-id')
                if (!_this.beforeUpload(fileObj)) {
                    $(e.target).val('');
                    // ie9 下input值清空的兼容性写法
                    if (this.isIE9) {
                        var cf = $(this).clone();
                        $(this).remove();
                        cf.appendTo("form[target=" + inputId + ']');
                    }
                    return false;
                }
                var curForm = $(e.target).parents('form'),
                    wrap = curForm.parents('.iu-wrap'),
                    fileId = _this._getUniqueCode();

                fileObj.id = e.target.id = fileId;
                wrap.attr('list-id', fileId);

                _this.appendListItem(fileObj);

                curForm[0].submit();
                wrap.removeClass('new').addClass('hide');
                _this._checkNum();

                _this._createInputObj();
            });

            this.$picker.on("click", ".iu-file", function () {
                $(this).parents('.iu-wrap').removeClass('new').addClass('choose');
            });

            // 删除已上传的内容的操作
            if (this.canDelete) this.$list.on("click", ".iu-delete", function () {
                var id = $(this).attr('data-id')

                if (_this.deleteCallback) {
                    _this.deleteCallback(id);
                } else {
                    _this.deleteItem(id);
                }
            });
        },

        /**
         * 上传文件个数限制
         */
        _checkNum: function () {
            var allowNum = this.allowNum ? this.allowNum : 0;
            if (!allowNum) return;

            if (allowNum && this.$list.find('li').length >= allowNum) {
                this.$picker.addClass('disable').attr('title', '当前只支持上传' + allowNum + '个文件');
            } else {
                this.$picker.removeClass('disable').attr('title', '');
            }
        },
        /**
         * 获取文件对象：兼容ie9
         * @param {DOM对象} ele 
         */
        _getFile: function (ele) {
            var fileObj;
            if (!this.isIE9) {
                fileObj = ele.files[0]
            } else {
                fileObj = {};
                fileObj.name = ele.value.split('\\').pop();
                ele.id && (fileObj.id = ele.id);
            }
            fileObj.ext = fileObj.name.split('.').pop();
            return fileObj;
        },
        /**
         * 获取唯一码
         */
        _getUniqueCode: function () {
            return Math.random().toString().slice(2);
        },
        /**
         * 新增form组件
         */
        _createInputObj: function () {
            if (!this.$picker.find('.iu-wrap.new').length) {
                var id = this._getUniqueCode(),
                    mimeTypes = this.accept ? this.accept.mimeTypes : '';
                window['_' + id] = this;
                this.$picker.append('<div class="iu-wrap new" wrap-id="' + id + '">' +
                    '<iframe name="' + id + '" id="' + id + '" onload="' + '_' + id + '.upComplete(this)"></iframe>' +
                    '<form action="' + this.server + '" method="post" enctype="multipart/form-data" name="fileForm" target="' + id + '">' +
                    '<input type="file" class="iu-file" name="file" data-id="' + id + '" accept="' + mimeTypes + '">' +
                    '</form>' +
                    '</div>');
            }
        },
        /**
         * 文件大小转化
         * @param {字节数} bytes 
         * @returns 文件大小展示
         */
        _bytesToSize: function (bytes) {
            if (bytes === 0) return '0B';
            var k = 1024,
                sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                i = Math.floor(Math.log(bytes) / Math.log(k));

            return (bytes / Math.pow(k, i)).toPrecision(3) + sizes[i];
        }
    };
    window.IUploader = IUploader;
})();





