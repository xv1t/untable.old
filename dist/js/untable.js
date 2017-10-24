/* 
 * Untable.js (https://github.com/xv1t/untable)
 * Copyright (c) Fedotov Victor (https://github.com/xv1t)
 */

(function($){    

    var untable_instance_counter = 0;
    
    var controlKeys = [9,13,16,17,18,27,33,34,35,36,37,38,39,40,45,46,116];
    
    function fa(icon_class){
        return '<i class="fa fa-' + icon_class + '"></i>';
    }    
    
    // UnEntity
    /**
     * 
     * @param {object} data
     * @param {object} options
     * @returns {UnEntity}
     */
    var UnEntity = function(data, options){

        options = options || {};

        this.data = data || {};
        this.history = [];        
        this.new = options.new || false;
        this.modified = options.modified || options.new || false;
        this.exists = options.exists || false;
        this.cid = options.cid;
        this.prev = JSON.parse( JSON.stringify(data) );
        this.changed = {};
        this.idKey = options.idKey || 'id';
        this.untable = options.untable;
        
        //list of row cells
        this.cells = {};

        this.id = data[ this.idKey ];

        this.new = !this.id;
        if (this.new){
            this.modified = true;
            this.exists = false;
        }

        if (this.id){
            this.exists = true;
        }
        
        if (this.new){
            this.changed = $.extend(true, {}, this.data, this.changed);
        }

    };

    /**
     * Revert data from prev
     * @returns {undefined}
     */
    UnEntity.prototype = {
        undo: function(e){
            this.history = [];

            this.data = JSON.parse( JSON.stringify(this.prev) );
            this.changed = {};
            this.modified = false;

            this.setRowValues({changed: false});
            
            //revert table cells
            /*
            for (var key in this.cells){
                var val = this.get(key);
                this.setCellVal(key, val, {callback: false, reset: true});
            } */

            $(this).trigger('reset');
        },

        /**
         * Clear history, update prev data to current
         * @returns {undefined}
         */
        commit: function(){
            this.history = [];

            this.prev = JSON.parse( JSON.stringify(this.data) );
            this.changed = {};

            $(this).trigger('commit.unentity');
        },
        
        /**
         * Construct row, or reset all
         * insert control cells, event, types into row
         * @returns {undefined}
         */
        makeRow: function(){
            this.tr.empty();
            this.cells = [];

            if ( this.untable.indicator ){
                this.tr.append(
                    $('<td>')
                        .addClass('row-indicator')
                 );
            }
            
            //create cells controls
            for (var i = 0; i < this.untable.columns.length; i++){
                var column = this.untable.columns[i];
                var td = $('<td>')
                    .attr('data-col', i)
                    .css({
                        'max-width': column.width,
                        'min-width': column.width,
                        'width': column.width,
                        display: column.visible ? 'table-cell' : 'none',
                        'text-align': column.align
                    });
                    
                var control_type = 'text';
                var editable = false;
                
                if (column.editable){
                    editable = true;
                }
                
                if (this.untable.readonly === true){
                    editable = false;
                }
                
                if (column.type in $.untable.columnsTypes 
                    && $.untable.columnsTypes[ column.type ].control){
                    control_type = $.untable.columnsTypes[ column.type ].control;
                    
                    if (!editable && $.untable.columnsTypes[ column.type ].readonlyControl){
                        control_type = 
                            $.untable.columnsTypes[ column.type ].readonlyControl;
                    }
                }
                
                this.tr.append(td);
                
                var control = $('<input>')
                    .attr('type', control_type)
                    .attr('data-col', i)
                    .attr('name', column.field)
                    .addClass( !editable ? 'disabled-control' : undefined )
                    .addClass('control-align-' + column.align);
                   
                td.append(control);
                this.cells[ column.field ] = control;
                
                if ( !editable ){
                    //disable all mouse, keyboard events but couldnot lose focus!
                    control
                        .attr('autocomplete', 'off')	
                        .on('keypress keyup keydown', function(e){
                            if ( controlKeys.indexOf( e.keyCode) >= 0){
                                return;
                            }
                            e.preventDefault();  
                            return false;
                        })
                        .on('paste cut', function(e){
                             e.preventDefault();
                        })
                    if ( column.type === 'boolean' ){
                        control
                         .on('click', function(){
                             return false;
                         })
                    }
                } else {
                    control
                        .on('change', this.controlOnChange)
                        
                    }; //else
                    
                control
                    .on('focus', function(){
                        var cid = $(this).closest('tr').data('cid');
                        
                        var entity =$(this).closest('tr').data('entity');
                        
                        entity.untable.set_current(cid);
                        
                        if (entity.untable.unselectMode){
                            return;
                        }

                        if ( ! $(this).hasClass('unselect-opened') ){
                            $.unselect.closeAll();
                        }
                    });                
            }
        },
        
        /**
         * set the values of the cells
         * @returns {undefined}
         */
        setRowValues: function(options){
            for (var i = 0; i < this.untable.columns.length; i++){
                this.setCellValueFromData( this.untable.columns[i].field, options );
            }
        },
        
        /**
         * Set value of single cell from the Entity data
         * @returns {undefined}
         */
        setCellValueFromData: function(field, options){
            var column = this.untable.columns.find(function(__column){
                return __column.field === field
            });
            
            if (!column){
                return;
            }
            
            options = options || {};
            
            
            var control = this.cells[ field ];
            var editable = false;

            if (column.editable){
                editable = true;
            }
            
            if (this.untable.readonly === true){
                editable = false;
            }
            
            if (options.changed === false){
                control.removeClass('changed');
                control.parent().removeClass('changed');
            }
            
            if (options.changed === true){
                control.addClass('changed');
                control.parent().addClass('changed');
            }
            
            
            cell_value = this.get(field);
            
            switch (column.type) {
                case 'boolean':
                    control.prop('checked', cell_value === true )
                    break;
                    
                case 'date':
                    if ( typeof cell_value === 'string'){
                        //Extract date from fucking format 2017-09-12T00:00:00+00:00
                        cell_value = cell_value.split('T')[0];
                    } else {
                        cell_value = null;
                    }
                    
                    control.val(cell_value);
                    break;
                    
                case 'unselect':
                    
                    if (editable){                    
                        if ( control.data('unselect') ){
                            //update
                            var unselect = control.data('unselect');
                            unselect.set(
                                cell_value,
                                this.get( column.unselect.field ),
                                {dontSync:true}
                             )
                        } else {
                            //create unselect element
                            var unselectOptions = $.extend(true, {}, column.unselect);
                            unselectOptions.text = this.get( column.unselect.field );

                            unselectOptions.untableSource = {
                                entity: this,
                                column: column,
                                untable: this.untable
                            };

                            $(control).unselect( unselectOptions );
                            this.unselectObject = $(control).data('unselect');
                        }
                    } else {
                        //readonly lookup
                        control.val( this.get( column.unselect.field ) );
                    }
                    break;
                     
                default:
                    control.val(cell_value)
                    break;
            }
             
        },
        

        /**
         * Create tr with td cells
         * Check editable cell
         * @returns {undefined}
         */
        render: function(){
            
            this.makeRow();
            this.setRowValues();
        },

        /**
         * Context: <input>
         * @returns {undefined}
         */
        controlOnChange: function(){
            var entity = $(this).closest('tr').data('entity');
            var value = this.value;
            
             switch (this.type) {
                 case 'checkbox':
                     value = this.checked;
                     break;
                     
                 default:
                     
                     break;
             }
            
            entity.set(this.name, value);

            //entity.set( $(this )
        },

        /**
         * Read data from remote and update object
         * @returns {undefined}
         */
        read: function(options){
            if (this.new){
                console.warn('This entity is new, Nothing to read from remote', this);
                return;
            }
            
            options = options || {};
            this.onReadSuccess = options.success;
            
            $.ajax({
                url: this.untable.rest.url + '/' + this.id,
                type: 'GET',
                data: this.untable.rest.data,
                context: this,
                success: function(res){
                    //console.log('read data', res);
                    //reset all data
                    
                    this.prev = res.data;
                    this.undo();
                    
                    if (typeof this.onReadSuccess === 'function'){
                        this.onReadSuccess.call(this);
                    }
                }
            })
        },

        /**
         * 
         * @param {string} key
         * @returns {Number}
         */
        nestLevel: function(key){
            if ( key.indexOf('.') < 0 ){
                return 1;
            }

            return key.split('.').length
        },
        
        /**
         * delete rwcord
         * @returns {undefined}
         */
        delete: function(){                    
            $.ajax({
                url: this.untable.rest.url + '/' + this.id,
                type: 'DELETE',
                context: this,
                success: function(res){                            
                    if (res.status === 'success'){
                        console.log('Delete', res);

                        var untable = this.untable;

                        untable.next();
                        this.tr.remove();
                        
                        var cid = this.cid;
                        
                        untable.entities[ this.cid ] = null;
                        delete untable.entities[ cid ];

                        if (!untable.get_current()){
                            untable.last();
                        }

                    } else {
                        console.warn('Record not deleted on remote side!')
                    }
                }
            });
        },

        /**
         * Delete key from object
         * @param {string} key
         * @returns {undefined}
         */
        removeKey: function(key, options){
            options = options || {}
            if ( ! this.isset(key) ){
                return false;
            }

            var prevous = this.get(key);
            var value = undefined;
            var operation = 'delete';

            if (this.nestLevel(key) === 1){    
                var event = {key, prevous, value, operation};

                delete this.data[key];
                this.eventChangeData(event, options.addEvent);
                return true;
            }

            var keys = key.split('.');

            var string = 'this.data[ keys[0] ]';

            var path = [];
            for (var i = 1; i < keys.length; i++){
                path.push(string);
                string += '[ keys[' + i + '] ]';

            }

            return eval('delete ' + string);
        },

        /**
         * 
         * @param {string} key
         * @returns {boolean}
         */
        isEmpty: function(key){
            if (!this.isset(key)){
                return false;
            }

            var target = this.get(key) ;

            if ( typeof target === 'object' ){
                return Object.keys(target).length === 0;
            }

            return false;
        },
        
        /**
         * 
         * @param {type} options
         * @returns {undefined}
         */
        save: function(options){
            
            options = options || {};
            
            //chack the modified
            if (!this.modified){
                console.warn('Entity was not modified', this);
                return;
            }
            
            var method = this.new ? 'POST' : 'PUT';
            
            var suffixUrl = this.new ? '' : '/' + this.id;
            
            this.onSaveSuccess = options.success;
            this.readAfterSave = options.readAfterSave !== false;      
            
            var ajaxOptions = {
                url: this.untable.rest.url + suffixUrl,
                method,
                context: this,
                delay: options.delay,
                data: {
                    data: this.changed,
                    cid: this.cid,
                    id: this.id
                },
                success: function (res, textStatus, jqXHR) {
                    console.log('res', res);
                    if (res.status === 'success'){
                        //save is ok
                        if (this.new){
                            //Set a id of Entity from the remote
                            this.id = res.id;
                            this.new = false;
                        }
                        
                        this.modified = false;
                                                
                        if (typeof this.onSaveSuccess === 'function')
                             this.onSaveSuccess.call(this)
                        

                        if (this.readAfterSave === true){
                            console.log('Read after save')
                            this.read();
                        }
                    }
                }
            };
            
            return $.ajax( ajaxOptions );
        },

        disable_setCellVal: function(key, value, options){
            if ( key in this.cells && key in this.untable.columnKeys ){

                options = options || {};
                var column = this.untable.get_col( key );
                var cell_value = value;
                
                var control = this.cells[ key ];
                
                
                 switch (column.type){
                     case 'unselect': 
                         control.data('unselect').set(
                            cell_value,
                            this.get( column.unselect.field ),
                            {dontSync: true}
                         );
                         break;
                     case 'date': 
                         cell_value = null
                         if ( typeof value === 'string' ){
                             cell_value = value.split('T')[0];
                         }
                 }
                 if (column.type !== 'unselect'){
                    control.val( cell_value )
                        .addClass('changed')
                        .closest('td').addClass('changed');
                   }


                if (options.reset){
                    control.removeClass('changed')
                        .closest('td').removeClass('changed');
                }
            }
        },

        /**
         * 
         * @param {string} key
         * @param {type} value
         * @returns {undefined}
         */
        set: function(key, value, options){

            options = options || {};
            
            if ( options['changed'] !== false ){
                options.changed = true;
            }
            
            //batch sets
            if (typeof key === 'object'){
                for (var __key in key){
                    this.set(__key, key[__key], value, options);
                }
                return this;
            }

            var operation = this.isset(key) ? 'update' : 'create';
            var prevous = this.get(key);
            var event = {key, value, prevous, operation};

            if (this.nestLevel(key) === 1){
                this.data[key] = value;
                this.changed[key] = value;
                
                this.eventChangeData(event, options.addEvent);
                //this.setCellVal(key, value, options);
                this.setCellValueFromData(key, options);
 
                return this;
            } 

            var keys = key.split('.');
            var string = 'this.data[ keys[0] ]';

            for (var i=1; i < keys.length; i++){
                if (eval("typeof " + string ) !== 'object' || eval(string) === null ){
                    eval(string + " = {}");
                }
                string = string + '[ keys[' + i + '] ]';
            }

            //set data
            eval(string + '=value');
            
            this.eventChangeData(event, options.addEvent);
            //this.setCellVal(key, value, options);
            this.setCellValueFromData(key, options);
            
            return this;

        },

        /**
         * 
         * @param {string} key
         * @returns {boolean}
         */
        isset: function(key){
            if ( this.nestLevel(key) === 1){
                return key in this.data;
            };    

            var keys = key.split('.');

            if (! keys[0] in this.data ){
                return false;
            }

            var currKey = this.data[ keys[0] ];

            for (var i=1; i < keys.length; i++){
                let nextKey = keys[i];

                if (!nextKey){
                    return false
                }

                if (typeof currKey !== 'object'){
                    return false;
                }

                if ( currKey !== null && nextKey in currKey){
                    currKey = currKey[nextKey];
                } else {            
                    return false;
                }
            }

            return true;      
        },

        eventChangeData: function(event, addEvent){
            if (addEvent === false)    {
                return;
            }

            event.cid = this.cid;
            event.id = this.id;

            console.log('eventChangeData')

            this.modified = true;
            this.history.push(event);
            $(this).trigger('update', [event]);
        },

        /**
         * 
         * @param {string} key
         * @returns {unresolved}
         */
        get: function(key){

            if ( this.nestLevel(key) === 1){

                if ( key in this.data ){
                    return this.data[key];
                } 

                return;
            };

            var keys = key.split('.');

            currKey = this.data[ keys[0] ];

            if (!currKey){
                return;
            }

            for (var i=1; i < keys.length; i++){
                let nextKey = keys[i];

                if (typeof currKey !== 'object'){
                    return;
                }

                if ( nextKey in currKey){
                    currKey = currKey[nextKey];
                } else {            
                    return;
                }
            }

            return currKey;    
        }
    };
    // EnEntity end
    
    // Column    
    var Column = function(options, _id, untable){
        this._id = _id;
        this._untable = untable;
        
        options = $.extend(true, {}, $.untable.columnDefaults, options);
        
        $.extend(this, options);
        
        this.label = this.label || this.field;
        this.width = this.width || $.untable.columnsTypes[ this.type ].width;
        this.align = this.align || $.untable.columnsTypes[ this.type ].align;
    };
    
    Column.prototype = {       

        hide: function(){
            this.setVisible(false);
        },

        show: function(){
            this.setVisible(true);
        },

        toggle: function(){
            this.setVisible(! this.visible );
        },

        setVisible: function(visible){
            this._untable.tbody.find('td[data-col=' + this._id + ']')
             .css({
                 display: visible ? 'table-cell' : 'none'
             });
             
            this._untable.element.find('table thead th[data-col=' + this._id + ']')
                .css({
                    display: visible ? 'table-cell' : 'none'
                });     
                
            this._untable.element.find('table tfoot th[data-col=' + this._id + ']')
                .css({
                    display: visible ? 'table-cell' : 'none'
                });                

             this.visible = visible;
        },

        setWidth: function(width){
            this._untable.tbody.find('td[data-col=' + this._id + ']')
                .css({
                    width: width,
                   'min-width': width,
                   'max-width': width
                });
                
            this._untable.element.find('table thead th[data-col=' + this._id + ']')
                .css({
                    width: width,
                   'min-width': width,
                   'max-width': width
                });
                
            this._untable.element.find('table tfoot th[data-col=' + this._id + ']')
                .css({
                    width: width,
                   'min-width': width,
                   'max-width': width
                });

            this.width = width;
        }
    }
    
    //Column end    
    
    /****** UnTable *******/
    
    $.untable = {
        defaults: {
            addTemplate: {},
            autoFetch: true,
            autoFirst: true,
            buttons: [],
            columns: [],
            canCreate: true,
            canDelete: true,
            canEdit: true,
            displayKey: 'name',
            height: 300,
            idKey: 'id',
            indicator: true,
            readonly: false,
            rest: {
                url: null,
                data: {}
            },
            showColumns: true,
            showFilter: true,
            showFooter: true,
            showHeadingBar: true,
            showBottomBar: true,
            showNavi: true,
            unselectMode: false,
        },
        columnDefaults: {
            editable: false,
            type: 'string',
            visible: true,     
            filter: true
        },
        columnsTypes: {
            string: {
                width: 200,
                align: 'left',
                control: 'text'
            },
            date: {
                width: 150,
                align: 'center',
                control: 'date',
                readonlyControl: 'text'
            },
            unselect: {
                width: 200,
                align: 'left',
                control: 'text'
            },
            boolean: {
                width: 150,
                align: 'center',
                control: 'checkbox'
            },
            number: {
                width: 150,
                align: 'right',
                control: 'number'
            },
            integer: {
                width: 150,
                align: 'right',
                control: 'number'
            },
            float: {
                width: 150,
                align: 'right',
                control: 'number'
            },
            money: {
                width: 150,
                align: 'right',
                control: 'number',
                /* set 0.01 */
            },
        }
    };
    
    /**
     * Create untable instance
     * @param {object} el
     * @param {object} options
     * @returns {$.untable.core}
     */
    $.untable.create = function(el, options){
                
        var __untable = new $.untable.core( ++untable_instance_counter );
        
        options = $.extend(true, {}, $.untable.defaults, options);
        $(el).data('untable', __untable);
        
        __untable.init(el, options);
        
        return __untable;
    };
    
    /**
     * 
     * @param {type} id
     * @returns {undefined}
     */
    $.untable.core = function(id){        
        this._id = id;
    };
    
    $.untable.core.prototype = {
        
        /**
         * 
         * @param {object} options
         * @returns {UnEntity}
         */
        add: function(options){
            
            if (this.readonly === true || this.canCreate === false){
                console.warn('Add new row canceled');
                return;
            }
            
            options = options || {};
            options.data = options.data || {};
            var addTemplate = JSON.parse( JSON.stringify( this.addTemplate ) );
            
            options.data = $.extend(true, {}, addTemplate, options.data);
            
            if ( $.isEmptyObject (options.data) )
                console.warn('addTemplate is empty');
            
            var entity = new UnEntity(options.data, {
                new: true
            });
            
            this.insert(entity);
            this.last(true);
            
            return entity;
        },
        
        /**
         * Return entity by cid
         * @param {type} cid
         * @returns {Array}
         */
        at: function(cid){
            return this.entities[cid];
        },
        carcass: function(){
            this.element
                .empty()
                .append(
                $(
                    '<div class="untable-container" tabindex="1">' +
                        '<div class="untable-heading"></div>' +
                        '<div class="untable-thead-wrapper">' +
                            '<table><colgroup class="thead"></colgroup><thead>' +
                                '<tr class="columns"></tr>' +
                                '<tr class="filter"></tr>' +
                        '</table></div>' +
                        '<div class="untable-tbody-wrapper">' +
                            '<table><colgroup class="tbody"></colgroup><tbody></table>' +
                        '<div class="fakerow"></div>' +
                        '</div>' +
                        '<div class="untable-tfoot-wrapper">' +
                            '<table><colgroup class="tfoot"></colgroup><tfoot><tr class="tfoot"></table>' +
                        '</div>' +
                        '<div class="untable-bottom">' + 
                            '<div class="un-btn-toolbar bottom-toolbar">' + 
                                '<div class="un-btn-group navi-group"></div>' + 
                            '</div>' + 
                        '</div>' +
                    '</div>'
                )
            );
           
            this.tbody = this.element.find('table tbody');
            this.trColumns = this.element.find('table thead tr.columns');
            this.trFilter = this.element.find('table thead tr.filter');
            this.trFoot = this.element.find('table tfoot tr.tfoot');
            this.bottomToolbar = this.element.find('.un-btn-toolbar.bottom-toolbar');
            this.navGroup = this.element.find('.un-btn-toolbar.bottom-toolbar .navi-group');
            
           
            this.element
                .find('.untable-tbody-wrapper')
                .scroll(function(e){
                    
                    
                    var __untable = $(this).closest('.untable').data('untable')
                    
                    __untable.element
                        .find('.untable-thead-wrapper, .untable-tfoot-wrapper')
                        .scrollLeft(this.scrollLeft);
                       
                    if ( ! __untable.unselectMode ){
                        $.unselect.closeAll();
                    }
                });           
        },
        
        /**
         * Remove all rows, empty entitis list
         * @returns {undefined}
         */
        clear: function(){
            this.entities = [];
            this.tbody.empty();
        },
        
        delete_current: function(){
            
            if (this.readonly === true || this.canDelete === false)
            {
                console.warn('Delete canseled')
                return false;
            }
            
            var entity = this.get_current();
            
            var toDelete = false;
            
            if (entity){
                console.log('Delete current', entity);
                
                if (this.canDelete === true){
                    toDelete = true;
                }
                
                if (this.canDelete === false){
                    return false;
                }
                
                if (typeof this.canDelete === 'function'){
                    toDelete = this.canDelete.call(entity);
                }
                
                if (toDelete){
                    
                    entity.delete();

                } else {
                    console.warn('Delete cancelled');
                }
                
            }
        },
        
        destroy: function(removeElement){
            
            console.log('untable.destroy', this, this.element);
            
            this.element.removeData();
            this.element.empty();
            //this = null;
            
            this.columns = null;
            
            for (attr in this){
                this[ attr ] = null;
                delete this[ attr ];
            }
            
            if (this.element)
                this.element
                    .removeClass('untable')
                    .removeAttr('untable');
               
            if (removeElement === true && this.element){
                this.element.remove();
            }
            
            this.element = null;
            
            delete this;
        },
        
        fetch: function(page, options){
            
            options = options || {};
            
            this.element.trigger(
                'before_fetch.untable', 
                [this]
            );
    
            if (!this.rest.data.page){
                this.rest.data.page = page || 1;
            }
    
            if (page){
                this.rest.data.page = page;
            } 
            
            this.response = {
                pagination: {}
            };            
    
            $.ajax({
                context: this,
                url: this.rest.url,
                type: 'GET',
                data: this.rest.data || {},
                success: function(res){
                    //this.response = res;
                    
                    if (res.pagination){
                        this.response = this.response || {};
                        this.response.pagination = JSON.parse(JSON.stringify(res.pagination));
                    }
                    
                    console.log('response', this.response);
                    
                    this.load(res.data || []);
                    
                    this.element.trigger(
                        'fetch.untable', 
                        [this, res]
                    );
                   
                   this.nav();
                   
                   if (this.autoFirst === true){
                       this.first( options.focused );
                   }
                },
                error: function(){
                    console.log('fetch.error.res');
                }
            });
        },
        
        /**
         * apply
         * @returns {undefined}
         */
        filter: function(e){
            console.log(e.keyCode);
            if (e){
                
                if (e.keyCode === 40 /*ARROW_DOWN*/){
                    this.first(true);
                }
                
                if ( controlKeys.indexOf(e.keyCode) > -1 ){
                    return;
                }
            }
            
            var filters = [];
            var having = [];
            
            var untable = this;
            this.trFilter.find('input,select').each(function(){
                var col = $(this).data('col');
                
                var column = untable.columns[col];
                
                var filterField = column.field;
                var isHaving = false;
                
                if (typeof column.filter === 'object'){
                    filterField = column.filter.field || filterField;
                    isHaving = column.filter.having ? true : false;
                }
                
                //console.log($(this).value);
                
                var canFilter = true;
                
                var val = $(this).val();
                
                var filteringOptions = {
                    search: val,
                    field: filterField
                };
                
                switch (column.type){
                    case 'number':
                    case 'integer':
                    case 'string':
                        break;
                    default:
                        canFilter = false;
                        break;
                }
                
                if (canFilter){
                    if (isHaving){
                        having.push(filteringOptions)
                    } else {
                        filters.push(filteringOptions);
                    }
                }
            });
            
            this.rest.data.filters = filters;
            this.rest.data.having = having;
            
            this.fetch(1);
            
            console.log('filters', {where: filters, having: having});
            //return filters;
        },        
        
        first: function(focus){
            var cid = this.tbody.find('tr').first().data('cid');
            this.set_current(cid);
            
            if (focus === true){
                this.tbody.find('tr').first().focus();
            }            
        },
        
        /**
         * Recalculate and Fit height of all components
         * @returns {undefined}
         */
        fit: function(){
            var height = {
                    heading: this.showHeadingBar ? 24 : 0,
                    thead: {
                        columns: this.showColumns ? 22 : 0,
                        filter : this.showFilter ? 22 : 0
                    },
                    tbody: 0,
                    tfoot: this.showFooter ? 22 : 0,
                    bottom: this.showBottomBar ? 24 : 0,
                    user: this.height
            };
            
            height.tbody = this.height - (
                height.heading +
                height.thead.columns +
                height.thead.filter +
                height.tfoot +
                height.bottom + 5
             );
            
            this.element.find('.untable-tbody-wrapper').css({
                height: height.tbody
            });
            
            //console.log('fit', height);
        },
        
        /**
         * initialize object
         * @param {type} el
         * @param {type} options
         * @returns {undefined}
         */
        init: function(el, options){
            
            this.element = $(el).addClass('untable').attr('untable', this._id);
            
            $.extend(this, options);
            
            options.cols = this.columns;
            
            delete this.columns;
            this.columns = [];
            
            this.modified = false;
            this.created = false;
            this.tbodyWidth = null;
            
            this.current = null;
            this.response = {};
            
            this.carcass();
            
            this.columnKeys = {};
            
            //analyze columns            
            for (var i=0; i < options.cols.length; i++){
                options.cols[i].untable = this;
                var column = new Column(options.cols[i], i, this);
                this.columns.push( column );
                this.columnKeys[ options.cols[i].field ] = i;
                
                this.tbodyWidth += column.visible ? column.width : 0;
            }
            
            delete this.cols;
            
            //initialize empty list of entities
            this.entities = [];
            
            this.setup();
            this.toolbars();
            this.nav();
            
            this.fit();
            
            if (this.autoFetch === true){
                this.fetch(1);
            }
        },
        
        /**
         * Return entity by real id
         * @param {ineger} id
         * @returns {undefined}
         */
        get: function(id){
            return this.entities.find(function(entity){
                return entity.id == id;
            })
        },
        
        /**
         * 
         * @param {string|integer} col
         * @returns {undefined}
         */
        get_col: function(col){
            if (typeof col === 'string' && col in this.columnKeys){
                return this.columns[ this.columnKeys[col] ];
            };
            
            if (typeof col === 'number'){
                return this.columns[ col ];
            };
        },
        
        get_current: function(){
            var current_tr = this.tbody.find('tr.selected');
            
            if (current_tr.length === 1){
                return current_tr.data('entity');
            }
            
            return false;
        },
        
        get_new: function(){
            return this.entities.filter(function(ent){
                if (ent.new)
                    return true;
            });
        },
        
        get_modified: function(){
            return this.entities.filter(function(ent){
                if (ent.modified)
                    return true;
            });
        },
        
        /**
         * Insert row into table
         * @param {UnEntity} entity
         * @returns {UnEntity}
         */
        insert: function (entity){
            entity.cid = this.entities.length;
            entity.untable = this;
            entity.idKey = this.idKey;
            
            entity.tr = $('<tr>')
                    .attr('data-cid', entity.cid)
                    .attr('tabindex', 2)
                    .data('entity', entity);
                   
            this.tbody.append(entity.tr);

            entity.tr
                .on('focus', function(){
                    $(this).data('entity').untable.set_current(
                        $(this).data('cid')
                     );
                })
                .on('dblclick', function(){
                    var untable = $(this).closest('.untable').data('untable');

                        untable.element.trigger('selected.untable', [
                            $(this).data('entity')
                        ])
                })
                .on('keyup', $.proxy(function(e){
                    switch (e.keyCode) {
                      case 27 /*ESCAPE*/:
                          if ( this.unselectMode ){
                              $.unselect.closeAll();
                          }
                          break;
                          
                      case 33 /*PAGE UP*/:
                          this.page_prev(true);
                          break;
                          
                      case 34 /*PAGE DOWN*/:
                          this.page_next(true);
                          break;
                          
                      case 35 /*END*/:
                          this.last(true);
                          break;
                          
                      case 36 /*HOME*/:
                          this.first(true);
                          break;
                          
                      case 38 /*ARROW UP*/:
                          this.prev(true);
                          break;
                          
                      case 40 /*ARROW DOWN*/:
                          this.next(true);
                          break;
                          
                      default:
                          
                          break;
                  }
                }, this))

            entity.render();

            //associate entity with tr

            this.entities.push(entity);

            $(entity).on('update', function(e, event){
                this.untable.modified = true;
                this.untable.element.trigger('modified.untable', [this, event]);
            });
            
            return entity;
        },
        
        is_modified: function(){
            return this.entities.find(function(entity){
                return entity.modified;
            }) ? true : false;
        },
        
        /**
         * Load array to entity list
         * @param {type} data
         * @returns {undefined}
         */
        load: function(data, options){
            this.clear();
            this.current = null;
            
            options = options || {};
            
            for (var i=0; i < data.length; i++){
                //Add entity
                var entity = new UnEntity(data[i], {
                    cid: i,
                    untable: this,
                    idKey: this.idKey
                });
                
                //add tr
                
                this.insert(entity);
            }
            
            if (this.defaultSelect){
                var entity = this.get(this.defaultSelect);
                if (entity) {
                    this.set_current({cid: entity.cid})
                }
                this.defaultSelect = null;
            }
        },
        
        last: function(focus){
            var cid = this.tbody.find('tr').last().data('cid');
            this.set_current(cid);
            
            if (focus === true){
                this.tbody.find('tr').last().focus();
            }            
        },        
        
        next: function(focus){
            
            var selected_row = this.tbody.find('tr.selected');
                        
            if (selected_row.length === 0){                
                return this.first();
            }
            
            var next_row = this.tbody.find('tr.selected').next();
            
            if (next_row.length === 0){
                return;
            }
            
            var cid = next_row.data('cid');
            this.set_current(cid);
            
            if (focus === true){
                next_row.focus();
            }            
        },    
        
        
        nav_btn_fetch_page: function(){
            var page = parseInt( $(this).text() );
            var untable = $(this).closest('.untable').data('untable');
            
            untable.fetch(page, {focused: true});
            //console.log(page);
        },
        
        /*
         * Generate nav buttons
         * @returns {undefined}
         */
        nav: function(){
            if (this.showNavi === false){
                return
            }
            this.navGroup.empty();
            this.navOptions = {};
            
            var totalRecords = 0;
            var startRecord = 0;
            var totalPages = 0;
            var currentPage = 0;
            
            if (this.response && this.response.pagination){
                totalRecords = this.response.pagination.total_count;
                startRecord = this.response.pagination.start;
                currentPage = this.response.pagination.page;
                
                totalPages = Math.ceil(
                  this.response.pagination.total_count / 
                  this.response.pagination.limit);
                 
                 this.response.pagination.totalPages = totalPages;
                  
            }
                        
            var navi = {
                currentPage,
                totalPages,
                left: false,
                right: false
            };
            
            if (totalPages > 1){
                
                //left
                
                
                if ( navi.currentPage === 1 ){
                    navi.left = false;
                }
                
                if (navi.currentPage > 1){
                    navi.left = {
                        first: 1,
                        pages: [],
                        start: currentPage - 4,
                        end: currentPage - 1
                    };
                    
                    if (navi.left.start <= navi.left.first){
                        navi.left.start = navi.left.first + 1;
                    }
                    
                    if (navi.left.end <= navi.left.first){
                        navi.left.end = navi.left.first + 1;
                    }
                    
                    if (navi.left.end === navi.left.start && navi.left.end === currentPage){
                        navi.left.end = false;
                        navi.left.start = false;
                        navi.left.pages = false;
                    }
                    
                }
                
                //right.end
                navi.right = {
                    last: totalPages,
                    start: currentPage,
                    pages: []
                };
                
                navi.right.end = currentPage + 3;
                if (navi.right.end >= totalPages){
                    navi.right.end = totalPages - 1;
                }
                
                if (navi.right.end < navi.right.start){
                    navi.right.end = navi.right.start
                }
                
                if ( navi.right.end === navi.right.start
                
                    && navi.right.start === navi.right.last
                 ) {
                    navi.right.pages = false;
                    navi.right.end = false;
                    navi.right.start = false;
                 }
            } 
            
            this.navOptions = navi;
            
            //left pages
            
            if (navi.left !== false){
                if (navi.left.first !== false){
                    //first
                    this.navGroup.append(
                        $('<button class="un-btn">')
                            .text(navi.left.first)
                            .click(this.nav_btn_fetch_page)
                     );
                }
                
                if ( navi.left.start && navi.left.end){
                    
                    for (var i=navi.left.start; i< navi.left.end+1; i++){
                        this.navGroup.append(
                        $('<button class="un-btn">')
                            .text( i )
                            .click(this.nav_btn_fetch_page)
                     );
                    }
                }
            }

            
            
            //left navi
            
            this.navGroup.append(
                $('<button class="un-btn">')
                    .click($.proxy(function(){
                        this.first(true);
                    }, this))
                    .html( fa('step-backward') ),
                $('<button class="un-btn">')
                    .click($.proxy(function(){
                        this.prev(true);
                    }, this))
                    .html( fa('backward') ),
             );
            
            
            
            //records
            this.navGroup.append(
                $('<button class="un-btn">')
                   .html('<span class="current-pos">' + startRecord + '</span> / <span class="total">'  + totalRecords + '</span>')
                );
               
            //right navi
            this.navGroup.append(
                $('<button class="un-btn">')
                    .click($.proxy(function(){
                        this.next(true);
                    }, this))
                    .html( fa('forward') ),
                $('<button class="un-btn">')
                    .click($.proxy(function(){
                        this.last(true);
                    }, this))
                    .html( fa('step-forward') ),
             );            
            
            //add new
            
            if (!this.readonly && this.canCreate){
                this.navGroup.append(
                    $('<button class="un-btn">')
                        .click($.proxy(function(){
                            this.add();
                        }, this))
                        .html( fa('plus-circle') ),
                        );
            }
            
            //right pages
         
            if (navi.right !== false){
                
                
                if ( navi.right.start && navi.right.end){
                    var first = true;
                    for (var i=navi.right.start; i< navi.right.end + 1; i++){
                        this.navGroup.append(
                            $('<button class="un-btn">')
                                .text( i )
                                .addClass( first ? 'un-btn-primary' : null)
                                .click(this.nav_btn_fetch_page)
                         );
                        first = false;
                    }
                }
                
                //last
                if (navi.right.last !== false){
                    //first
                    this.navGroup.append(
                        $('<button class="un-btn">')
                            .text(navi.right.last)
                            .addClass( navi.right.last === currentPage ? 'un-btn-primary' : null)
                            .click(this.nav_btn_fetch_page)
                     );
                }                
            }         
         
        },
        
        page_prev: function(){
            
            if ( this.response && this.response.pagination ){
                console.log('page prev!');
                if (this.response.pagination.page > 1){
                    
                    this.fetch( this.response.pagination.page - 1, {focused: true, last: true} );
                }
            }
        },
        
        page_next: function(){
            if ( this.response && this.response.pagination ){
                console.log('page next!');
                if (this.response.pagination.page < this.response.pagination.totalPages){
                    
                    this.fetch( this.response.pagination.page + 1,  {focused: true, first: true}  );
                }
            }
        },
        
        prev: function(focus){
            
            var selected_row = this.tbody.find('tr.selected');
                        
            if (selected_row.length === 0){                
                return this.last();
            }
            
            var next_row = this.tbody.find('tr.selected').prev();
            
            if (next_row.length === 0){
                return;
            }
            
            var cid = next_row.data('cid');
            this.set_current(cid);
            
            if (focus === true){
                next_row.focus();
            }            
        },        

        /**
         * Save all modified records
         * @param {object} options
         * @returns {undefined}
         */
        save: function(options){
            
            var toSave = false;
            
            if (this.readonly){
                console.warn('Save canceled [readonly]');
                return false
            };
            
            options = options || {};
            
            var deffereds = this.get_modified().map(function(el){
                return el.save();
            });
            
            if (deffereds.length === 0)
                return console.warn('Nothing to save!');
            
            $.when(...deffereds)
             .done(function(){
                
                console.log('Saved rows: ' + deffereds.length);
             });
        },

        /**
         * Construct all interface elements such as:
         * columns, filter, heading, tfoot
         * @returns {undefined}
         */
        setup: function(){
            //Columns
            
            this.trColumns.empty();
            
            var colgroup_thead = this.element.find('colgroup.thead');
            var colgroup_tbody = this.element.find('colgroup.tbody');
            var colgroup_tfoot = this.element.find('colgroup.tfoot');
            
            if (this.indicator === true){
                this.trColumns.append(
                    $('<th class="thead-indicator">')                    
                        .html('&nbsp;')
                 );
                this.trFilter.append(
                    $('<th class="thead-indicator">')
                        .html('&nbsp;')
                 );
                this.trFoot.append(
                    $('<th class="thead-indicator">')
                        .html('&nbsp;')
                 );
                colgroup_thead.append($('<col>'));
                colgroup_tbody.append($('<col>'));
                colgroup_tfoot.append($('<col>'));
            }
            for (var i=0; i< this.columns.length; i++){
                
                //colgroup
                colgroup_thead.append($('<col>'));
                colgroup_tbody.append($('<col>'));
                colgroup_tfoot.append($('<col>'));
                
                //columns
                var col = this.columns[i];
                var th = $('<th>')
                    .attr('data-col', i)
                    .css({
                        width: col.width,
                       'min-width': col.width,
                       'max-width': col.width,
                       'display': col.visible ? 'table-cell' : 'none',
                       'text-align': col.align
                    })
                    .text( col.label );
                
                this.trColumns.append(
                    th
                 );
                
                /**
                 * Need a controls
                 * @type jQuery
                 */
                var th_filter = $('<th>')
                    .attr('data-col', i)
                    .css({
                        width: col.width,
                       'min-width': col.width,
                       'max-width': col.width,
                       'display': col.visible ? 'table-cell' : 'none'
                    });
                
                col.filterControl = null;
                
                if ( col.filter !== false )    {
                    var filter_control = 
                        $('<input>')
                            .attr('data-col', i)
                            .attr('type', 'text')
                           
                    filter_control
                        .on('change keyup', $.proxy(this.filter, this));
                           
                    col.filterControl = filter_control;
                    
                    th_filter.append(filter_control);
                }
                    
                this.trFilter.append( th_filter );
                
                var td_tfoot = $('<th>')
                    .attr('data-col', i)
                    .css({
                        width: col.width,
                       'min-width': col.width,
                       'max-width': col.width,
                       'display': col.visible ? 'table-cell' : 'none'
                    });
                this.trFoot.append( td_tfoot );
            }
        },
        
        set_current: function(options){
            var cid;
            var tr;
            if ( typeof options === 'number' ){
                cid = options;
                tr = this.tbody.find('tr[data-cid=' + cid + ']');
                if (tr.length === 0){
                    console.warn('Row with cid=' + cid + ' not found');
                    return;
                }
            }
            
            if (typeof options === 'object'){
                if ( 'id' in options ){
                    //set by id and return cid
                    //var ent = this
                }
                
                if ( 'cid' in options ){
                    //set by cid
                    cid = options.cid
                }
            }
                        
            if (arguments.length === 0){
                tr = $(this);
                cid = $(this).data('cid');
            }
            
            if (typeof tr !== 'object')
                return;
            
            if (!tr && tr.length === 0){
                
                return;
            }
            
            var prevous_cid = tr.data('entity').untable.current;
            
            if (tr.length > 0){
                var entity = tr.data('entity');
                
                if (entity.untable.current === null){
                    entity.untable.element.trigger('current.untable', [entity]);
                }
                
                if (entity.untable.current !== null && 
                    entity.untable.current != cid){
                    
                    //change row detected
                    
                    //save prevous selected row if changed
                    entity.untable.element.trigger('current.untable', [entity]);
                    entity.untable.element.trigger('row_blur.untable', [
                        entity.untable.entities[entity.untable.current]
                    ]);
                }
                
                if (entity.untable.current !== null && 
                    entity.untable.current == tr.data('cid')){
                    
                    
                    console.log('Row has no changed!!')
                    
                    return;
                }
                
                
                tr.closest('tbody')
                    .find('tr.selected')
                    .removeClass('selected');
                   
                
                tr.closest('tbody')
                    .find('tr.prev-selected')
                    .removeClass('prev-selected');
                   
                tr
                    .addClass('selected')
                    .prev().addClass('prev-selected');
                   
                entity.untable.current = cid;
                
                //update current button
                var startRecord = 1;
            
                if (entity.untable.response && entity.untable.response.pagination){                 
                    startRecord = entity.untable.response.pagination.start;
                }
                this.navGroup.find('.current-pos').text( cid + startRecord );
                
                //analyze on lookup
                //if (tr.find('.unselect-opened').length === 0){
                //    $.unselect.closeAll();
                //}
            }
        },
        
        toolbars: function(){
            var heading = this.element.find('.untable-heading');
            
            heading.empty();
            
            if ( this.showHeadingBar === false ){
                heading.css('display', 'none');
                //return;
            }
            
            if ( this.showBottomBar === false ){
                this.bottomToolbar.css('display', 'none');
                //return;
            }
            
            
            var toolbar1 = $('<div class="un-btn-toolbar">');
            
            //main navi group
            var nav_group = $('<div class="un-btn-group">');
            var manage_group = $('<div class="un-btn-group">');
            
            toolbar1.append(nav_group);
            toolbar1.append(manage_group);
            
            heading.append( toolbar1 );
            
            /*
             * 
            nav_group.append(
                $('<button class="un-btn">')
                    .click($.proxy(function(){
                        this.first(true);
                    }, this))
                    .html( fa('step-backward') ),
                $('<button class="un-btn">')
                    .click($.proxy(function(){
                        this.prev(true);
                    }, this))
                    .html( fa('backward') ),
               );
               
            nav_group.append(
                $('<button class="un-btn">')
                    .click($.proxy(function(){
                        this.next(true);
                    }, this))
                    .html(  fa('forward')  ),
                $('<button class="un-btn">')
                    .click($.proxy(function(){
                        this.last(true);
                    }, this))
                    .html( fa('step-forward') ),
                ); */
            manage_group.append(
                $('<button class="un-btn refresh">')
                    .click($.proxy(function(){
                        this.fetch(undefined, {focused: true});
                    }, this))
                        .html(fa('refresh')),
                $('<button class="un-btn save">')
                    .click($.proxy(function(){
                        this.save();
                    }, this))
                        .css( 'display', 
                            this.readonly === true || this.canDelete === true ? 'none' : 'block-inline' )
                        .html(fa('save')),
                $('<button class="un-btn">')
                    .click($.proxy(function(){
                        this.delete_current();
                    }, this))
                        .css( 'display', 
                            this.readonly === true || this.canDelete === true ? 'none' : 'block-inline' )
                        .html(fa('trash')),
                );
                
        },
        
        test: function(){
            console.log('test', this, arguments);
        }
    };
    
    /********** UnSelect ********/
    
    $.unselect = {
        defaults: {
            //indicator: true,
        }
    };
    
    /**
     * Close all opened lookup
     * @returns {undefined}
     */
    $.unselect.closeAll = function(){
        $('.unselect-lookup').each(function(){
                $(this).data('unselect').cancel();
            });        
    }
    $.unselect.create = function(el, options){

                
        var __unselect = new $.unselect.core( ++untable_instance_counter );
        
        options = $.extend(true, {}, $.unselect.defaults, options);
        $(el).data('unselect', __unselect);
        
        __unselect.init(el, options);
        
        return __unselect;
    };
    
    $.unselect.core = function(id){

    };
    
    $.unselect.core.prototype = {
        
        cancel: function(){
               
            if (!this.untableElement)
                return;
            
            
            var untable = this.untableElement.data('untable');
            
            if (!untable)
                return;
            
            this.element.removeClass('unselect-opened');
            
            this.untableElement.remove();
            untable.destroy(true);
            
            this.untableElement.data('untable', null);
            
            if (this.untableSource)
                this.untableSource.unselectOpened = null;
        },
        
        init: function(el, options){
            
            this.element = $(el);
            
            this.element
                .attr('autocomplete', 'off')	
                .attr('role', 'unselect-display')
                .data('unselect', this);
            
            this.elementHidden =                 
                $('<input type="hidden" class="unselect-hidden">')               
                    .attr('role', 'unselect-value')
                    .attr('name', this.element.attr('name') )
                    .val( this.element.val() )
                    .data('unselect', this);
                   
            this.element.removeAttr('name')
                   
            this.element
                .attr('type', 'text')
                //.attr('readonly', true)
                .val( options.text );
               
            this.text = options.text;
               
            this.element.after( this.elementHidden );
            
            this.elementEvents();
            
            this.untableOptions = options.untable;
            this.untableSource = options.untableSource;
            
            this.lookupIdKey = options.lookupIdKey || 'id';
            this.lookupDisplayKey = options.lookupDisplayKey || 'name';
                   
        },
        
        elementEvents: function(){
            this
                .element
                .off('dblclick keyup')
                .on('dblclick', $.proxy( this.open, this ))                
                .on('keyup', function(e){
                    var __unselect = $(this).data('unselect');
                    e.stopPropagation();
                    switch (e.keyCode){
                        case 27: //ESC
                            __unselect.cancel();
                            break;
                        case 13: //ENTER
                        case 40: //ARROW_DOWN
                            __unselect.open(e);
                            break;
                    }
                    this.value = __unselect.text ? __unselect.text : null;
                    return false;
                })
                
        },
        
        open: function(e){
            
            //Stop event to parent
            e.stopPropagation();
            
            //Close other opened lookup untables
            $('.unselect-lookup').each(function(){
                $(this).data('unselect').cancel();
            });
            
            this.untableElement = $('<div>')
                .addClass('untable unselect-lookup')
                .data('unselect', this)
            
            $('body').append(
              this.untableElement
            );
            
            css = {
                position: 'absolute',
                top     : //$(this).position().top
                         0  + this.element.offset().top
                              + this.element.outerHeight(),
                height: 300,             
                left    : this.element.offset().left,
                width   : this.untableOptions.width || this.element.outerWidth(),
                'background-color': 'white',
            };
            
            this.untableElement
                .css(css);
               
            this.untableOptions.showHeadingBar = false;
            this.untableOptions.showBottomBar = false;
            this.untableOptions.showNavi = false;
            this.untableOptions.unselectMode = true;
            this.untableOptions.parentUnselect = this;
            
            
            this.untableElement.untable(this.untableOptions);
            $(this.untableElement)
                .on('selected.untable', function(e, entity){
                    
                    var __unselect = entity.untable.parentUnselect;
                    
                    var val  = entity.get( __unselect.lookupIdKey );
                    var text = entity.get( __unselect.lookupDisplayKey );
                    
                    __unselect.set( val, text );
                    
                    $.unselect.closeAll();
                });
            
            this.element
                .addClass('unselect-opened')
                
            
            if (this.untableSource)
                this.untableSource.untable.unselectOpened = this;
            
        },
        
        set: function(value, text, options){
            
            options = options || {};
            
            this.element.val(text);
            this.element.data('value', value);
            this.elementHidden.val(value); 
            
            this.text = text;
            
            if (options.dontSync !== true && this.untableSource){
                //console.log(this.untableOptions);
                
                //set display text
                this.untableSource.entity.set( 
                    this.untableSource.column.unselect.field,
                    text);
                    
                //set val
                this.untableSource.entity.set( 
                    this.untableSource.column.field,
                    value);
                //this.untableOptions
            }
        }
    }; //unselect.core.prototype
    
    /********jQuery initialize class*******/
    
    /**
     * jQuery method untable
     * @param {type} arg
     * @returns {untableL#5.$.fn|@var;instance|Boolean}
     */
    $.fn.untable = function(arg){
        var is_method = typeof arg === 'string',
            args = Array.prototype.slice.call(arguments, 1),
            result = null;

        if (arg === true && !this.length){
            return false; 
        }

        this.each(function(){
            var instance = $(this).data( 'untable' );            
            var method = is_method && instance ? instance[arg] : null;

            if (instance){
                result = is_method && method 
                    ? method.apply(instance, args)
                    : null;
            }

            if (!instance && !is_method){
                $.untable.create(this, arg);
            }

            if( (instance && !is_method) || arg === true ) {
                result = instance || false;
            }

            if(result !== null && result !== undefined) {
                return false;
            }
        });
        return (result !== null && result !== undefined) 
            ? result 
            : this;
    };        
    
    /**
     * jQuery method unselect
     * @param {object} arg
     * @returns {untableL#5.$.fn|@var;instance|Boolean}
     */
    $.fn.unselect = function(arg){
        var is_method = typeof arg === 'string',
            args = Array.prototype.slice.call(arguments, 1),
            result = null;

        if (arg === true && !this.length){
            return false; 
        }

        this.each(function(){
            var instance = $(this).data( 'unselect' );            
            var method = is_method && instance ? instance[arg] : null;

            if (instance){
                result = is_method && method 
                    ? method.apply(instance, args)
                    : null;
            }

            if (!instance && !is_method){
                $.unselect.create(this, arg);
            }

            if( (instance && !is_method) || arg === true ) {
                result = instance || false;
            }

            if(result !== null && result !== undefined) {
                return false;
            }
        });
        return (result !== null && result !== undefined) 
            ? result 
            : this;
    };        
    
    
    
    
})(jQuery);