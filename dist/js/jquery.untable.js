/*
 * 
 * Depricated library: use untable.js
 * Untable.js (https://github.com/xv1t/untable)
 * Copyright (c) Fedotov Victor (https://github.com/xv1t)
 */
(function($){     
    const UNTABLE_KEYCODE__8_BACKSPACE= 8;
    const UNTABLE_KEYCODE_13_ENTER  = 13;
    const UNTABLE_KEYCODE_16_SHIFT  = 13;
    const UNTABLE_KEYCODE_17_CTRL   = 13;
    const UNTABLE_KEYCODE_18_ALT    = 13;
    const UNTABLE_KEYCODE_27_ESCAPE = 27;
    const UNTABLE_KEYCODE_35_END    = 35;
    const UNTABLE_KEYCODE_36_HOME   = 36;
    const UNTABLE_KEYCODE_37_LEFT   = 37;
    const UNTABLE_KEYCODE_38_UP     = 38;
    const UNTABLE_KEYCODE_39_RIGHT  = 39;
    const UNTABLE_KEYCODE_40_DOWN   = 40;
    const UNTABLE_KEYCODE_45_INS    = 45;
    const UNTABLE_KEYCODE_46_DEL    = 46;
    
    var TRIGGER = {
          AFTER: {
              CREATE: 'untable.after.create',
              READ  : 'untable.after.read',
              UPDATE: 'untable.after.update',
              DELETE: 'untable.after.delete',
              UNDO  : 'untable.after.undo',
              CHANGE: 'untable.after.change',
              FETCH : 'untable.after.fetch',
              SAVE  : 'untable.after.save',
              ROW   : 'untable.after.row',
          },
          BEFORE: {
              CREATE: 'untable.before.create',
              READ  : 'untable.before.read',
              UPDATE: 'untable.before.update',
              DELETE: 'untable.before.delete',     
              UNDO  : 'untable.before.undo',
              FETCH : 'untable.before.fetch',
              SAVE  : 'untable.before.save',
              ROW   : 'untable.before.row',
              INIT  : 'untable.before.init'

          },
          ERROR: {
              CREATE: 'untable.error.create',
              READ  : 'untable.error.read',
              UPDATE: 'untable.error.update',
              DELETE: 'untable.error.delete',
              FETCH : 'untable.error.fetch',
          }, 
          CANCEL: {
              DELETE: 'untable.cancel.delete'
          },
          ROW: {
              DBLCLICK: 'untable.row.dblclick',
              SELECT  : 'untable.row.select'
          },
              MODIFIED    : 'untable.modified',
              UNMODIFIED  : 'untable.unmodified',
              FOCUS       : 'untable.focus',
              BLUR        : 'untable.blur',
              CLEAR       : 'untable.clear',
              CLOSE       : 'untable.close',
              CHOOSE      : 'untable.choose' //<--choose row in the lookup mode
    };

    var untablesCounter = 1; //global counter for each table on the current document

  //data types config
    var data_types = {
        default: {
            type: 'string',
            width: 200,
            align: 'left',
            input: 'text'
        },
        string: {            

        },
        integer: {
            width: 100,
            align: 'right',
            input: 'number'
        },
        boolean: {
            align: 'center',
            input: 'checkbox'
        },
        lookup: {
            align: 'left',
            input: 'hidden'
        }

    };
  
    /**
     * 
     * @param {object} object
     * @param {string} field
     * @param {string} prefix
     * @returns {jquery.untableL#7.getPrefixObjVal.object}
     * 
     * getPrefixObjVal({id: 23, name: 'Title'}, 'name');
     * return 'Title'
     * 
     * getPrefixObjVal({Article: {id: 23, name: 'Title'}}, 'name', 'Article');
     * return 'Title'
     */
    function getPrefixObjVal(object, field, prefix){
        if (!prefix){
            return object[field];
        }

        if ( typeof object[prefix] === 'object' && object[prefix] !== null ){
            return object[prefix][field];
        }
    };

    function fa(icon_class){
        return '<i class="fa fa-' + icon_class + '"></i>';
    }
    
    var untable_methods = {        
	added: function(){
            var i;
            var changed_rows = [];
            for (i=0; i < $(this).data('rows').length; i++){
                if ( $(this).data('rows')[i].changed !== false 
                    && $(this).data('rows')[i].added === true
                    && $(this).data('rows')[i].deleted === false
                    ){
                    var row = $(this).data('rows')[i];
                    changed_rows.push({
                        cid: row.cid,
                        data: row.changed                       
                    });
                }
            }
            return changed_rows;
	},
         
	autofilter_change: function(e){	   
            var filters = [];
            var having  = [];
            $(this)
                .untable()
                .find('thead tr.autofilter th[autofilter]')
                .each(function(){
                    var col = $(this).data('col');
                    switch (col.type) {
                        case 'boolean':
                            var val = $(this).find('select').val();
                            var field = col.filterField || col.field;
                            if (val){
                                val = val === 'true';
                                var boolVal = val;

                                if (val){
                                    if (col.filterTrueSql){
                                        filters.push({
                                            field: field,
                                            sql: col.filterTrueSql
                                        });
                                        break;
                                    }
                                    if (col.filterTrueValue){
                                         boolVal = col.filterTrueValue;
                                    }

                                } else { //false
                                    if (col.filterFalseSql){
                                        filters.push({
                                            field: field,
                                            sql: col.filterFalseSql
                                        });
                                        break;
                                    }
                                    if (col.filterFalseValue){
                                         boolVal = col.filterFalseValue;
                                    }
                                }

                                if (col.filterHaving){
                                        having.push({
                                            field: col.filterField,
                                            type: 'boolean',
                                            search: boolVal
                                         });
                                } else {
                                    filters.push({
                                        field: col.filterField,
                                        type: 'boolean',
                                        search: boolVal
                                    });
                                }
                                 //other
                                $(this).addClass('filtered');
                            } else {
                                   $(this).removeClass('filtered');
                                }
                            break;
                        case 'string':
                        case 'unselect':
                            var val = $(this).find('input').val();
                            if (val){
                                if (col.filterHaving){
                                    having.push({
                                        field: col.filterField,
                                        search: val
                                    });
                                } else {
                                    filters.push({
                                        field: col.filterField,
                                        search: val
                                    });
                                }
                                $(this).addClass('filtered');
                            } else {
                                $(this).removeClass('filtered');
                            }
                            break;

                        default:
                            break;
                    } //</switch>
                }); //</each>
	   
            if (filters.length || having.length){
                 $(this).closest('tr').find('th.thead-autofilter-indicator')
                            .html( fa('filter') );
            } else {
                 $(this).closest('tr').find('th.thead-autofilter-indicator')
                            .html('');
            }

            $(this).untable('options').rest.data.filters = filters;
            $(this).untable('options').rest.data.having = having;
	   
            $(this).untable('fetch', 1);

            console.log('filters', filters);
	}, //</autofilter_change>
         
	cell_focuced_remove: function(){
            console.log('untable.cell_focuced_remove: "', arguments[0] , '"')
            $('.focused-border').remove();
	},
        
	cell_blur: function(){
            console.log('untable.cell_blur', this, $(this).hasClass('unselect-opened'));
            
            if ( $(this).hasClass('unselect-opened') ){
                console.log('hasClass(unselect-opened)', true)
                return;
            }
            
            $(this).closest('td').removeClass('focused');
            untable_methods.cell_focuced_remove('untable.cell_blur');
	 },
         
	cell_border: function(rect){
	   
	},
         
	cell_focus: function(e){
            
            console.log('untable.cell_focus', this);
            e.preventDefault();
            untable_methods.col_focus.call(this);

            if ( $(this).untable('options').lookupMode === true )
                return;
            untable_methods.cell_focuced_remove('untable.cell_focus');
            
            //cell border
            var td = $(this)[0].tagName === 'TD' ? $(this) :  $(this).closest('td');

            td.addClass('focused');
            
            rect       = $(td).position();
            rect.width = $(td).outerWidth();
            rect.height= $(td).outerHeight();
            rect.left  = $(td).offset().left;
            
            //select row
            untable_methods.select_row.call( $(this).closest('tr') );
            
            var focusBorderWidth = $.fn.untable.defaults.focusBorderWidth || 6;
            
            //add 4 lines
            $('body').append(
                $('<div>') //left
                    .addClass('focused-border')
                    .attr('aria-untable-uid', $(this).untable().attr('untable-uid'))
                    .css({
                        top: rect.top - focusBorderWidth/2 ,
                        left: rect.left - focusBorderWidth/2,
                        width: focusBorderWidth,
                        height: rect.height + focusBorderWidth
                    }),
                $('<div>') //top
                    .addClass('focused-border')
                    .css({
                        top: rect.top - focusBorderWidth/2 ,
                        left: rect.left - focusBorderWidth/2,
                        width: rect.width + focusBorderWidth,
                        height: focusBorderWidth
                    }),
                $('<div>') //right
                    .addClass('focused-border')
                    .css({
                        top: rect.top - focusBorderWidth/2 ,
                        left: rect.left + rect.width - focusBorderWidth/2,
                        width: focusBorderWidth,
                        height: rect.height + focusBorderWidth
                    }),
                $('<div>') //right
                    .addClass('focused-border')
                    .css({
                        top: rect.top + rect.height - focusBorderWidth/2,
                        left: rect.left - focusBorderWidth/2,
                        width: rect.width + focusBorderWidth/2,
                        height: focusBorderWidth
                    }),
            );
	}, //cell_focus
        
	change: function(){            
            var col = $(this)
                .untable()
                .data('options')
                .cols[ $(this).data('col') ];
        
            var val;

            switch (col.type) {
                case 'boolean':
                    val = $(this).prop('checked');
                    break;
                case 'unselect':
                    val = $(this).data('value');
                    break;

                default:
                    val = $(this).val();
                    break;
            }

            var cid = $(this).closest('tr').data('cid');

            if (typeof $(this).untable().data('rows')[cid]['changed'] !== 'object'){
                $(this).untable().data('rows')[cid]['changed'] = {};
            }

            $(this).untable().data('rows')[cid]['changed'][ col.field ] = val;

            $(this).closest('tr').addClass('changed');
            $(this).closest('td').addClass('changed');

            var status = {
                context: this,
                col    : col,
                field  : col.field,
                value  : val,
                cid    : cid,
                row    : $(this).untable().data('rows')[cid],
                id     : $(this).closest('tr').data('id')
            };

            //set button status
            $(this)
                .untable()
                .find('button.btn-save,button.btn-undo')
                .removeClass('disabled');

            $(this).untable().trigger( TRIGGER.AFTER.CHANGE , [status]);

            if ($(this).untable().data('options').saveImmediately === true){
                $(this).untable('save');
            }
	},
         
	changed: function(){
            var i;
            var changed_rows = [];
            for (i=0; i < $(this).data('rows').length; i++){
                if ( $(this).data('rows')[i].changed !== false 
                        && $(this).data('rows')[i].added === false
                        && $(this).data('rows')[i].deleted === false
                    ){
                    var row = $(this).data('rows')[i];
                    changed_rows.push({
                        cid: row.cid,
                        data: row.changed,
                        id: row.id
                    });
                }
            }
            return changed_rows;
        },       
        
	clear :function(){
            untable_methods.process_data.call(this, []);
            $(this).trigger( TRIGGER.CLEAR );
	},   
        
	columns: function(){
            $(this)
                .find('tr.columns').empty();

            $(this)
                .find('tr.autofilter').empty();

            $(this)
                .find('tr.tfoot').empty();

            $(this)
                .find('tr.fakerow').empty();

            if ( $(this).data('options').row_indicator ){
                $(this)
                    .find('tr.columns')
                    .append($('<th class="thead-indicator">'));

                $(this)
                    .find('tr.autofilter')
                    .append($('<th class="thead-autofilter-indicator">'));

                $(this)
                    .find('tr.tfoot')
                    .append($('<td class="tfoot-indicator">'));

            }

            for (i=0; i < $(this).data('options').cols.length; i++){
                //Defaults column properties
                var col = {
                    type    : $(this).data('options').cols[i].type || data_types.default.type,
                    align   : data_types.default.align,
                    editable: false,
                    visible : true,
                    field   : undefined, 
                    filterModel: undefined,
                    filterField: undefined,
                    filterHaving: false,
                    filter  : true,
                    label   : $(this).data('options').cols[i].field
                    };

                //Align
                col.align = data_types[ col.type ] && data_types[ col.type ].align
                    ? data_types[ col.type ].align   
                    : data_types.default.align;

                col.width = data_types[ col.type ] && data_types[ col.type ].width
                    ? data_types[ col.type ].width
                    : data_types.default.width;

                col.cid = i;
                //Merge with user defined
                $.extend(col, $(this).data('options').cols[i]);

                if ( 
                    $(this).data('options').filterModel && 
                    col.filterModel === true && 
                    !col.filterField ){
                     col.filterField = $(this).data('options').filterModel + '.' + col.field
                }

                if (!col.filterField){
                    col.filterField = col.field;
                };

                //Add <th>
                $(this)
                    .find('tr.columns')
                    .append(
                        $('<th>')
                            .attr('col-index', i)
                            .text(col.label)
                            .append(
                                $('<i class="fa menu fa-sort-desc pull-right">')
                                .on('click', untable_methods.col_menu_btn)
                                )
                            .css({
                                display: col.visible ? 'table-cell' : none,
                                'min-width': col.width,
                                'max-width': col.width,
                                width: col.width,
                                'text-align': col.align
                            })
                    );

                var autofilter_control = undefined;
                var auto_filter_present = false;
                if (col.filter === true){		    
                     switch (col.type) {
                        case 'string':
                        case 'unselect':
                            autofilter_control = 
                                $('<input>')
                                    .attr('type', 'text')				
                                    .addClass('autofilter')
                                    .attr('data-col', col.cid)
                                    .on('change keyup', function(e){
                                        e.stopPropagation();

                                        switch (e.keyCode){
                                            case UNTABLE_KEYCODE_27_ESCAPE:
                                                if ( $(this).untable('options').lookupMode === true ){
                                                    $(this).trigger(TRIGGER.CLOSE)
                                                    
                                                    $('.unselect-opened')
                                                        .removeClass('.unselect-opened')
                                                        .focus();
                                                    $(this).untable('destroy');
                                                    return;
                                                }

                                                if ( $(this).val() == '' ){
                                                  return;
                                                }
                                                
                                                $(this).val('');
                                                break;
                                            case UNTABLE_KEYCODE_13_ENTER:
                                            case UNTABLE_KEYCODE_40_DOWN:
                                                $(this).untable().focus()
                                                break;
                                        } //switch

                                        untable_methods.autofilter_change.call(this);
                                      } ); //function				

                            auto_filter_present = true;
                            break;
                        case 'boolean':
                            autofilter_control = $(
                                '<select class="filter-boolean">' + 
                                   '<option></option>' + 
                                   '<option value="true">&#xf046;</option>' + 
                                   '<option value="false">&#xf096;</option>' + 
                                '</select>')
                                .addClass('autofilter')
                                .attr('data-col', col.cid)
                                .on('change keyup', function(e){
                                    e.stopPropagation();
                                    untable_methods.autofilter_change.call(this);
                                });
                        break;

                        default:
                            break;
                    } //switch
                }
                
                //fill autofilter
                $(this)
                    .find('tr.autofilter')
                    .append(
                        $('<th>')
                            .attr('col-index', i)
                            .data('col', col)
                            .attr('autofilter', auto_filter_present)
                            //.html('&nbsp;')
                            .append(autofilter_control)
                            .css({
                                display: col.visible ? 'table-cell' : 'none',
                                'min-width': col.width,
                                'max-width': col.width,
                                width: col.width,
                                'text-align': col.align
                            })
                    );
                   
                if ( autofilter_control ){
                    autofilter_control.on('blur', function(){
                        console.log('filter input blur')
                    })
                }

                //fill tfoot
                $(this)
                    .find('tr.tfoot')
                    .append(
                        $('<td>')
                            .attr('col-index', i)
                            .html('&nbsp;')
                            .css({
                                display: col.visible ? 'table-cell' : 'none',
                                'min-width': col.width,
                                'max-width': col.width,
                                width: col.width,
                                'text-align': col.align
                            })
                    );
            
                untable_methods.fakerow.call(this);
                $(this).data('options').cols[i] = col;
            } //for

            //theadBtn
            if (typeof $(this).data('options').theadBtn === 'object'){
              //
                var theadBtn = $(this).data('options').theadBtn;
                $(this).find('thead tr.columns th.thead-indicator:first')
                    .html(theadBtn.html || theadBtn.fa ? fa(theadBtn.fa) : null)
                    .click(theadBtn.click)
                    .attr('title', theadBtn.title)
                    .addClass('clickable')
                    .addClass(theadBtn.class)
                    .css(theadBtn.css || {});
            }
                
            return this;
	}, //columns
         
	col_focus: function(){
	   //coloring column
            var col_index = $(this).data('col');
	   	   
            if (typeof col_index === 'number'){
		//thead
		$(this).untable().find('thead th.focused, tfoot td.focused').removeClass('focused');
		$(this).untable().find('thead th[col-index=' + col_index + '], tfoot td[col-index=' + col_index + ']').addClass('focused');

            }	   
	},
         
	col_menu_btn: function(){
            //in progress
            alert('Column menu')
	},
        
	construct: function(){	   
            $(this).css({
                height: $(this).data('options').height
            });

            //Calculate component sizes
            var height = {
                user: $(this).data('options').height,
                heading: $(this).find('.untable-heading').height() > 0 
                     ? $(this).find('.untable-heading').height() 
                     : 22,
                tfoot: $(this).find('tr.columns').height() || 22,
                columns: $(this).find('tr.columns').height() || 22,
                autofilter: $(this).find('tr.columns').height() || 22,
                tbody: null
            };
            
            if ( $(this).find('.untable-heading').css('display') === 'none' ){
              height.heading = 0;
            }

            height.tbody = height.user - (
                height.heading  +   
                height.columns +   
                height.autofilter +   
                height.tfoot +   
                10 );

            $(this).find('.untable-tbody-wrapper')
                .height ( height.tbody);

            console.log('height', height);
	},
         
	create: function(){	   
            if ( $(this).data('options').readonly ){
                console.warn('This recordset is READONLY');
                return;
            }

            if ( $(this).data('options').allowCreate !== true ){
                console.warn('Creates rows are not allowed');
                return;
            }

            //Create a new row
            if ($(this).data('options').create_template === false){
                return console.warn('Please set `options.create_template`');
            };
            
            var create_template = $.extend( {}, $(this).data('options').create_template );
            var create_template_changed = $.extend( {}, $(this).data('options').create_template );

            for (let key in create_template_changed){
                if ( typeof create_template_changed[key] === 'object' ){
                    delete create_template_changed[key];
                }
            }

            //insert new row/data
            var cid = $(this).data('rows').push({
                added: true,
                changed: create_template_changed,
                deleted: false,
                id: null,
                datum: create_template
            }) - 1;

            $(this).data('rows')[cid].cid = cid;

            //add tr to table
            $tr = $('<tr>');

            $tr = untable_methods.process_row.call(this, $tr, create_template, cid);

            $(this).find('tbody').append(
                $tr.addClass('changed added')
            );
    
            $tr.trigger('click');
            
            $tr
                .find('input:first')
                .focus()
                .select();

            console.log(create_template);
            $(this).trigger( TRIGGER.MODIFIED );

            if ($(this).untable().data('options').saveImmediately === true){
                $(this).untable('save');
            }

            $(this).find('.untable-tbody-wrapper')
                .scrollTop(10000)
                .scrollLeft(0);            
	}, //create
         
	delete: function(){	   
	    if ( $(this).data('options').readonly )
	    {
                console.warn('Read only. Delete not passible')
                return;
	    }
	    
	    if ( $(this).data('options').allowDelete !== true )
	    {
                console.warn('Delete is not allowed!')
                return;
	    }
	    
	    //mark to delete selected row
	    $(this).find('tbody tr.selected')
                .each(function(){
                    var status = {
                        context: this,
                        cid: $(this).data('cid'),
                        id: $(this).data('id'),
                        display: $(this).untable('display_selected'),
                        allowDelete: true // <--------- this confirm it!!!!!!!
                    };

                    $(this)
                        .addClass('deleted');

		    // wrap this block, be couse redraw element has failed before JS dialog `confirm`
                    setTimeout(function(context, status){
                        $(context).untable().trigger( TRIGGER.BEFORE.DELETE , [status]);

                        if (status.allowDelete === true){
                            if ($(context).hasClass('added')){
                                //Added row
                                $(context).untable().data('rows')[ status.cid ] = false;
                                if (!$(context).untable('next')){
                                    $(context).untable('prev');
                                }
                                $(context).remove();
                                return;
                            }

                            $.ajax({
                                url: $(context).untable('options').rest.url + '/' + $(context).data('id'),
                                type: 'delete',
                                context: context,
                                success: function(res){
                                    if (res.status === 'success'){
                                        $(this).untable().trigger( TRIGGER.AFTER.DELETE , {
                                            context: this,
                                            id: $(this).data('id'),
                                            cid: $(this).data('cid')                                
                                        });

                                        $(this)                                
                                            .fadeOut(function(){
                                                $(this).untable().data('rows')[ status.cid ] = false;
                                                if (!$(context).untable('next')){
                                                    $(context).untable('prev');
                                                }
                                                $(this).remove();
                                            }); /**/
                                    } else {
                                        //error deleting on the remote
                                        console.error('Delete failed!');
                                        $(this).removeClass('deleted');
                                        $(this).untable().trigger( TRIGGER.ERROR.DELETE , [{
                                            context: this,
                                            id: $(this).data('id'),
                                            cid: $(this).data('cid'),
                                            response: res
                                        }]);
                                    }
                                } //success
                            }); //ajax

                            //$(this).trigger('untable.modified');
                        } else {			   
                            $(context).removeClass('deleted');
                            $(context).untable().trigger( TRIGGER.CANCEL.DELETE , [{
                                context: context,
                                id: $(context).data('id'),
                                cid: $(context).data('cid') 
                            }]);
                        }
		   }, 55, this, status); //setTimeout
	    });  //function         
	 },
         
	destroy: function(){
	   //destroy this object from DOM
	   $(this).remove();
	 },
         
	deleted: function(){
	    //return deleted rows
	 },
         
	display_selected: function(){
            //get a display value  of the selected row

            var cid = $(this)
                .find('tbody tr.selected').data('cid');

            var data_row = untable_methods.get_data_row.call(this, cid);

            if (data_row){
                return data_row.datum[ $(this).data('options').displayField ];
            }
	 },
         
	events: function(){
            //set main triggers
            $(this).on( TRIGGER.MODIFIED , function(){
                $(this)
                    .find('button.btn-save, button.btn-undo')
                    .removeClass('disabled');

                $(this).find('button.btn-fetch')
                    .addClass('disabled');
            });

            $(this).on( TRIGGER.UNMODIFIED  , function(){
                $(this)
                    .find('button.btn-save, button.btn-undo')
                    .addClass('disabled');

                $(this).find('button.btn-fetch')
                    .removeClass('disabled');
            });

            $(this).on( TRIGGER.BEFORE.FETCH, function(){
                $(this)
                    .find('.btn-fetch .fa-refresh')
                    .addClass('fa-spin');
            } );

            $(this).on( TRIGGER.AFTER.FETCH, function(){
                setTimeout(function(context){
                        $(context)
                            .find('.btn-fetch .fa-refresh')
                            .removeClass('fa-spin');
                    }, 
                    500, this);
            } );
	}, //events 
        
        fakerow: function(){
            //set fakerow width
            $(this).find('div.fakerow')
                .width( $(this).find('tr.columns').outerWidth() )
                .height(1)
        },
        
	fetch: function(){
            var page = 1;

            if (arguments.length > 0){
                page = arguments[0];
            }

            $(this).trigger( TRIGGER.BEFORE.FETCH , [page]);
            if ( $(this).untable('options').lookupMode !== true ){
                untable_methods.cell_focuced_remove('untable.fetch');
            }

            $(this).data('options').rest.data.page = page;

            $.ajax({
                type: 'get',
                url: $(this).data('options').rest.url,
                data: $(this).data('options').rest.data,                
                context: this,
                error: function(){
                    $(this).trigger( TRIGGER.ERROR.FETCH , arguments);
                },
                success: function(res){
                    console.log('fetch::res', res);            
                    $(this).data('options').data = [];

                    if (typeof res.data === 'object' && res.data.constructor === Array){                        
                        untable_methods.process_data.call(this, res.data);
                    }

                    if (typeof res.pagination === 'object'){
                        untable_methods.pagination.call(this, res.pagination);
                    } else {
                        untable_methods.pagination.call(this, false);
                    }

                    //Refresh tfoot
                    if ( typeof res.tfoot !== 'object' ){
                        res.tfoot = {};
                    }
                    untable_methods.tfoot.call(this, res.tfoot);

                    $(this).trigger( TRIGGER.AFTER.FETCH );
                }
            }); //ajax

            return this;
	}, //fetch
         
	first: function(){
            var tr = $(this).find('tbody tr[data-id]:first');
            if ($(tr).length !== 0){

                $(this).find('.untable-tbody-wrapper')
                    .scrollTop(0)
                      // .scrollLeft(0);                
                return untable_methods.select_row.call(tr);
            }
	},      
         
	get_col: function(col_name){
            var i;
            for (i=0; i< $(this).data('options').cols.length; i++){
                var col = $(this).data('options').cols[i];
                if ( col.field === col_name ){
                    return col;
                }
            }
	 },
         
	get_data_row: function(cid){
            //return onse rows[] object
            return $(this).data('rows')[cid];
	},
        
	get_data_row_id: function(id){
            //return onse rows[] object
            var i;
            for (i=0; i < $(this).data('rows').length; i++){
                var col = $(this).data('rows')[i];
                if (col.id === id){
                    return col;
                }
            }            
	},
         
	init: function(options){                        
            $(this).data('options',
                $.extend(true, {}, $.fn.untable.defaults, options)
            );

            $(this).attr('untable-uid', untablesCounter++);

            //rest options
            $(this).data('options').rest = 
                $.extend({                    
                    url: null,
                    data: {}              
                }, $(this).data('options').rest);

            $(this).data('options').rest.data = 
                $.extend({
                        limit: 100,
                        page: 1
                    }, $(this).data('options').rest.data
                );

            if ( $(this).data('options').on && 
                typeof $(this).data('options').on === 'object' ){
                for (var trigger_name in $(this).data('options').on){
                    if ( typeof $(this).data('options').on[ trigger_name ] === 'function' )
                        $(this).on( trigger_name, $(this).data('options').on[ trigger_name ] );
                } //for
            }

            $(this).data('untable', true);
            $(this).data('rows', []);
            $(this).data('current', {
                cid: null,
                id: null
            });
            $(this).addClass('untable');            
            $(this).trigger(TRIGGER.BEFORE.INIT)

            untable_methods.skeleton.call(this);     

            untable_methods.columns.call(this);
            untable_methods.heading.call(this);
            untable_methods.events.call(this);

            untable_methods.construct.call(this);

            $(this).attr('tabindex', 1);
            
            $(this).on('focus', function(){
                $(this).trigger( TRIGGER.FOCUS , true);                               
            });
            
            $(this).on('blur', function(){
                $(this).trigger( TRIGGER.BLUR , true);               
            });
            
            $(this).on('keyup', untable_methods.keyup);

            //user triggers in `options.on`

            //in bootstrap tabpane
            if ($(this).closest('.tab-pane').length === 1){
                var tab_id = $(this).closest('.tab-pane').attr('aria-labelledby');
                if (tab_id){
                    $('#' + tab_id)
                        .on('hidden.bs.tab', function(){
                            untable_methods.cell_focuced_remove('hidden.bs.tab');
                            })
                        .on('shown.bs.tab', function(){
                            var tab_id = $(this).attr('aria-controls');
                            $('#' + tab_id)
                                .find('.untable')
                                .each(function(){
                                    $(this)
                                        .untable('construct');

                                    $(this)
                                        .untable('fakerow');
                                });
                            });

                        //check parents
                    var parent_tab_id = $( '#' + tab_id ).closest('.tab-pane').attr('aria-labelledby');
                    if ( parent_tab_id ){
                        $('#' + parent_tab_id)
                        .on('hidden.bs.tab', function(){
                            untable_methods.cell_focuced_remove('hidden.bs.tab');
                        });
                    }
                }
            }

            //fetch
            if ( $(this).data('options').autoload === true ){
                untable_methods.fetch.call(this);
            }		

            return this;
	}, //init
         
	heading: function(){
            $(this)
                .find('.untable-heading')
                .css( 'display', $(this).data('options').toolbar ? 'block' : 'none' )
                .empty()
                .append($(
                    '<div class="btn-toolbar" role="toolbar">' +
                           '<div class="btn-group btn-group-sm untable-navi mr-1" role="group" ></div> ' +
                           '<div class="btn-group btn-group-sm untable-main mr-1" role="group" ></div> ' +
                           '<div class="btn-group btn-group-sm untable-buttons mr-1" role="group" ></div> ' +
                           '<div class="btn-group btn-group-sm untable-pagination mr-1" role="group" ></div>' +
                    '</div>'
                    )
                );

		//navi battons
            $(this).find('.btn-group.untable-navi')
                .append(
                    $('<button>')
                        .addClass('btn btn-outline-secondary btn-first')
                        .on('click', function(){
                            $(this).untable('first')
                        })
                        .html( fa('step-backward') ),
                    $('<button>')
                        .addClass('btn btn-outline-secondary btn-prev')
                        .on('click', function(){
                            $(this).untable('prev')
                        })
                        .html( fa('backward') ),
                );

            $(this).find('.btn-group.untable-navi')
                .append(    
                    $('<button>')
                        .addClass('btn btn-outline-secondary btn-next')
                        .on('click', function(){
                            $(this).untable('next')
                        })                
                        .html( fa('forward') ),
                    $('<button>')
                        .addClass('btn btn-outline-secondary btn-last')
                        .on('click', function(){
                            $(this).untable('last')
                        })                
                        .html( fa('step-forward') ),
                );
		    
		//main buttons
            $(this).find('.btn-group.untable-main')
                .append(
                    $('<button>')
                        .addClass('btn btn-outline-secondary btn-fetch')
                        .on('click', function(){
                            if ($(this).hasClass('disabled'))
                                   return;
                            $(this).untable('fetch');
                        })
                        .html( fa('refresh') ),

                    $(this).data('options').readonly || !$(this).data('options').allowEdit ? undefined :
                        $('<button>')
                            .addClass('btn btn-outline-secondary btn-save disabled')
                            .attr('title', 'Save')
                            .on('click', function(){
                                if ($(this).hasClass('disabled'))
                                   return;

                            $(this).untable('save')
                          })
                          .html( fa('save') ),

                    $(this).data('options').readonly || !$(this).data('options').allowEdit ? undefined :
                        $('<button>')
                            .addClass('btn btn-outline-secondary btn-undo disabled')
                            .attr('title', 'Undo')
                            .on('click', function(){
                                if ($(this).hasClass('disabled'))
                                     return;

                                $(this).untable('undo')
                            })
                            .html( fa('undo') ),

                       $(this).data('options').readonly || !$(this).data('options').allowEdit || !$(this).data('options').allowCreate ? undefined :
                       $('<button>')
                            .addClass('btn btn-outline-secondary btn-create')
                            .attr('title', 'Create record...')
                            .on('click', function(){
                                if ($(this).hasClass('disabled'))
                                    return;

                                $(this).untable('create');
                            })
                            .html( fa('plus') ),

                       $(this).data('options').readonly  || !$(this).data('options').allowDelete ? undefined :
                       $('<button>')
                            .addClass('btn btn-outline-secondary btn-delete disabled')
                            .attr('title', 'Delete record...')
                            .on('click', function(){
                                if ($(this).hasClass('disabled'))
                                    return;

                                $(this).untable('delete');
                            })
                            .html( fa('trash') ),
                );    //apend


		//user buttons
		
            if ( $(this).data('options').buttons.length > 0 ){		
                var i;
                for (i=0; i < $(this).data('options').buttons.length; i++){
                    var user_btn = $(this).data('options').buttons[i];

                    var btn_html = '';
                    if ( user_btn.icon ){
                         btn_html = fa(user_btn.icon);
                    }

                    if (user_btn.label){
                         btn_html = btn_html + ' ' + user_btn.label;
                    }

                    if (!btn_html){
                         btn_html = 'Button ' + (i+1);
                    }

                    $(this).find('.btn-group.untable-buttons').append(
                        $('<button>')
                            .addClass('btn btn-outline-secondary btn-user-button')
                            .addClass(user_btn.class)
                            .on('click', user_btn.click)
                            .attr('title', user_btn.title)
                            .attr(user_btn.attr || {})
                            .html(btn_html)
                        );
                } //for
            }

            //pagination buttons

	}, //heading
        
	choose: function(){
            var status = {
                selected: $(this).untable('selected'),
                displayValue: $(this).untable('display_selected'),
                closeLookup: true
            };

            $(this).untable().trigger( TRIGGER.CHOOSE, [status] );

            if ( status.closeLookup === true )
                $(this).untable().remove();
	},
         
	keyup: function(e){
            switch (e.keyCode) {
                case UNTABLE_KEYCODE_13_ENTER : //Enter
                    if ( $(this).untable('options').lookupMode === true ){
                        untable_methods.choose.call(this);
                        break;
                    }

                    //enter to selected row for first input
                    $(this).untable().find('tbody tr.selected:first input:first').focus();
                    break;

                case UNTABLE_KEYCODE_27_ESCAPE: //esacep
                    if ( $(this).untable('options').lookupMode === true ){
                        $(this).trigger(TRIGGER.CLOSE)
                         $(this).untable().remove();
                    }
                    break;

                case UNTABLE_KEYCODE_36_HOME: //home
                    $(this).untable('first');
                    break;
                    
                case UNTABLE_KEYCODE_35_END: //end
                    $(this).untable('last');
                    break;
                    
                case UNTABLE_KEYCODE_38_UP: //home
                    var selected_row = $(this).untable('selected_rows');

                    if (selected_row.length > 0){
                        if (selected_row.is(':first-child')){
                            $(this).untable().find('tr.autofilter input[type="text"]:first').focus()
                        }
                    }

                    $(this).untable('prev');
                    break;
                       
                case UNTABLE_KEYCODE_40_DOWN: //home
                    $(this).untable('next');
                    break;
                       
                case UNTABLE_KEYCODE_45_INS: //insert
                    $(this).untable('create');
                    break;
                    
                case UNTABLE_KEYCODE_46_DEL: //home
                    $(this).untable('delete');
                    break;

                default:
                    break;
            }
	}, //keyup
         
	last: function(){
            var tr = $(this).find('tbody tr[data-id]:last');
            if ($(tr).length !== 0){

                $(this).find('.untable-tbody-wrapper')
                    .scrollTop(100000)
                    .scrollLeft(0);

                return untable_methods.select_row.call(tr);
            }

	 },
         
	next: function(){
            var tr = $(this).find('tbody tr.selected');
            if ($(tr).next().length !== 0){
                return untable_methods.select_row.call($(tr).next());
            }
	 },  
         
	options: function(){
            return $(this).data('options');
	},
        
	process_data: function(data){

            $(this).find('tbody tr[data-id]').remove();

            var rows = [];

            for (var i = 0; i < data.length; i++){

                var $tr = $('<tr>');               

                $(this).find('tbody').append(
                       untable_methods.process_row.call(this, $tr, data[i], i )   
                              );

                rows.push({
                    cid: i,
                    deleted: false,
                    added: false,
                    id: data[i][ $(this).data('options').primaryKey ],
                    datum: data[i],
                    changed: false
                });
            }

            $(this).data('rows', rows);

            if ($(this).data('options').first === true ){
                $(this).untable('first');
            }
            $(this).trigger( TRIGGER.UNMODIFIED );

            return this;
	},
         
	process_row: function($tr, datum, cid){
            $tr
                .removeClass('changed')
                .attr('data-cid', cid)
                .empty();

            if ( $(this).data('options').row_indicator ){                
                $tr.append($('<td class="row-indicator">'));
            }
            
            var primaryKey = $(this).data('options').primaryKey;

            if ( typeof datum[ primaryKey ] !== 'undefined' ){
                $tr.attr('data-id', datum[ primaryKey ]);
            }
		
		//draggable
            if ($(this).data('options').draggable === true){
                $tr
                    .off('dragstart')
                    .on('dragstart', function(e){
                        var attributes = {};

                        console.log('attributes', $(this).untable()[0].attributes);

                        for (var i = 0; i < $(this).untable()[0].attributes.length; i++){
                            var attr = $(this).untable()[0].attributes[i].nodeName;
                            var attrValue = $(this).untable()[0].attributes[i].nodeValue;
                            attributes[ attr ] = attrValue;                           
                        }

                        console.log('attributes', attributes);

                         e.originalEvent.dataTransfer.setData('json', JSON.stringify({
                           data: datum,
                           untable: attributes
                         }));
                         console.log('dragstart row', this);
                    })
                    .attr('draggable', 'true')
            } //if draggable

            for (var i=0; i < $(this).data('options').cols.length; i++){
                var col = $(this).data('options').cols[i];

                var $td = $('<td>');
                $td.attr('data-col', i);

                $td.css({
                    width: col.width,
                    'max-width': col.width,
                    'min-width': col.width,
                    'text-align': col.align
                });

                if ( col.editable && 
                    $(this).data('options').readonly === false &&
                    $(this).data('options').allowEdit === true){
                       //editable cells
                        var $control = 
                            $('<input>')
                                .on('change', untable_methods.change)
                                .data('col', i)
                                .val(datum[ col.field ])
                                .on('focus', untable_methods.cell_focus)
                                .on('blur', untable_methods.cell_blur)
                                .on('keyup', function(e){
                                    //stop key events to parent
                                    e.stopPropagation();

                                    switch (e.keyCode) {
                                        case UNTABLE_KEYCODE_27_ESCAPE:
                                            $(this).untable().focus();
                                            break;

                                        case UNTABLE_KEYCODE_13_ENTER:
                                            //var next_input = $(this).closest('tr').find
                                            break;

                                        default:
                                            break;
                                    }
                                });

                        switch (col.type) {
                            case 'boolean':
                                $control
                                    .attr('type', 'checkbox')
                                    .prop('checked', datum[ col.field ]);
                                break;
                                
                            case 'integer':
                                $control.attr('type', 'number');
                                break;                            
                                   
                            case 'unselect':
                                //$control = $('<select>');
                                $td.append($control);
                                $control.unselect({
                                    displayValue: getPrefixObjVal(datum, col.unselect.displayField || 'name', col.unselect.dataPrefix),
                                    value: datum [col.field],
                                    untable: col.untable
                                });
                                break;                            

                            default:
                                $control.attr('type', 'text');
                                $td.append($control);
                                break;
                       }
                } else {
                    //only view 


                    switch (col.type) {
                        case 'boolean':
                            $td.append(
                                $('<input type="checkbox" disabled readonly>')
                                    .prop('checked', datum[ col.field ])
                                    );
                            break;
                        case 'unselect':
                            $td.text( getPrefixObjVal(
                                datum, 
                                col.unselect.displayField || 'name',  
                                col.unselect.dataPrefix)
                                );
                            break;

                        default:
                          $td.text( datum [col.field] );

                          break;

                    }
                    $td.attr('tabindex', 1);
                    $td.on('focus', untable_methods.cell_focus)  
                }		    
                $tr.append( $td );
            } //for

            //row events
            $tr.off('click');
            $tr.off('dblclick');

            $tr.on('click', untable_methods.select_row);
            $tr.on('dblclick', function(){
                untable_methods.select_row.call(this);

                if ( $(this).untable('options').lookupMode === true ){
                    //$(this).untable().trigger( TRIGGER.CHOOSE )
                    untable_methods.choose.call(this);
                    return;
                }

                var cid = $(this).data('cid');
                var status= {
                    tr: $(this),
                    trigger: TRIGGER.ROW.DBLCLICK,
                    id: $(this).data('id'),
                    data: $(this).untable().data('rows')[cid]
                };

                $(this).untable().trigger( TRIGGER.ROW.DBLCLICK, [status] );
            }); //dblclick
            
            var status = {
                trigger: TRIGGER.AFTER.ROW,
                tr: $tr,
                data: datum
            };
            
            $(this).trigger( TRIGGER.AFTER.ROW, [status] );
            return $tr;
	}, // process_row
         
	pagination: function(pagination_status){
            //construst pagination from options.pagination
            //untable-pagination

            $(this)
                .find('.untable-pagination')
                .empty();

            if (pagination_status === false){
                return;
            };

            //calculate pages count;
            /*
             * count:10
             * end 10
             * limit:"10"
             * page:"1"
             * start:1
             * total_count:25
             */
            pagination_status.total_pages = Math.ceil( 
                pagination_status.total_count / pagination_status.limit
                );

            if (pagination_status.total_pages <= 1){
                return;
            }

            for (var i=0; i< pagination_status.total_pages; i++){
                var currentClass = '';

                currentClass = 'btn-outline-secondary';
                if (i+1 === pagination_status.page ){
                    currentClass = 'btn-primary';
                }
                $(this)
                    .find('.untable-pagination')
                    .append(
                        $('<button>')
                            .text(i+1)
                            .data('page', i+1)
                            .addClass('btn ' + currentClass)
                            .on('click', function(){
                                $(this).untable('fetch', $(this).data('page'))
                            })
                        );
            } //for

            console.log('untable-pagination', pagination_status);
	},
         
	prev: function(){
            var tr = $(this).find('tbody tr.selected');
            if ($(tr).prev().length !== 0){
                return untable_methods.select_row.call($(tr).prev());
            }
	},
         
        reload_row: function(tr, savedStatus){
            if (typeof tr === 'object'){

            }

            if (typeof tr === 'number'){
                tr = $(this).untable().find('tbody tr[data-id=' + tr + ']');
            }

            if (!tr){
                return;
            }
		
            $(tr).removeClass('saved');
             
            var row_id = $(tr).data('id');
		   
            if (!row_id){
                return console.error('Row not found with id=' + row_id);
            }
		   
            $(this).trigger( TRIGGER.BEFORE.FETCH , []);
            
            $.ajax({
                url: $(this).untable('options').rest.url + '/' + row_id,
                type: 'get',
                data: $(this).untable('options').rest.data,
                context: tr,
                success: function(res){
                    //console.log('res', res);
                    if (res.data){
                        //reload datum cid
                        var cid = $(tr).data('cid');
                        $(tr).untable().data('rows')[ cid ]['datum'] = res.data;
                        $(tr).untable().data('rows')[ cid ].changed = false;
                        $(tr).untable().data('rows')[ cid ].deleted = false;
                        $(tr).untable().data('rows')[ cid ].added = false;

                        //reload tr
                        untable_methods.process_row.call( 
                            $(tr).untable(), 
                            tr, 
                            res.data, 
                            $(tr).data('cid'));
                            
                        if (savedStatus === true){
                            $(this).addClass('saved');
                        }
                        
                        $(this).trigger( TRIGGER.AFTER.FETCH , [1]);
                    }
                }
            }); //ajax
        },
         
	repaint: function(){
            //reconstruct the whole object
	},
        
	skeleton: function(){
            $(this)
                .empty()
                .append(
                $(
                    '<div class="untable-container">' +
                        '<div class="untable-heading"></div>' +
                        '<div class="untable-thead-wrapper">' +
                            '<table><thead>' +
                                '<tr class="columns"></tr>' +
                                '<tr class="autofilter"></tr>' +
                        '</table></div>' +
                        '<div class="untable-tbody-wrapper">' +
                            '<table><tbody></table>' +
                    '<div class="fakerow"></div>' +
                        '</div>' +
                        '<div class="untable-tfoot-wrapper">' +
                            '<table><tfoot><tr class="tfoot"></table>' +
                        '</div>' +
                    '</div>'
                )
            );

            $(this)
                .find('.untable-tbody-wrapper')
                .scroll(function(e){
                    $(this).closest('.untable')
                        .find('.untable-thead-wrapper, .untable-tfoot-wrapper')
                        .scrollLeft(this.scrollLeft);
                    if ( $(this).untable('options').lookupMode !== true ){
                        untable_methods.cell_focuced_remove('scroll');	  
                    }
                });

            return this;
	},
         
        selected_rows: function(){
            return $(this).find('tbody tr.selected')
        },
         
        selected: function(){
            //selected primary keys or array of primary keys
            var keys = [];
            
            $(this).find('tbody tr.selected').each(function(){
                keys.push($(this).data('id'));
            });

            if (keys.length === 0){
                return undefined;
            }

            if (keys.length === 1){
                return keys[0];
            }

            return keys;
        },
	 
        set_height: function(newHeight){
            $(this).data('options').height = newHeight;
            untable_methods.construct.call(this)
        },
	 
	 /**
	  * trigger: select.untable.row
	  * @returns {Boolean}
	  */
        select_row: function(){
            if ( $(this).hasClass('selected') )
                return;

            $(this).parent().find('tr').removeClass('selected');
            $(this).addClass('selected');

            $(this)
                .untable()
                .data('current', {
                    cid: $(this).data('cid'),
                    id: $(this).data('id')
                })
                .trigger( TRIGGER.ROW.SELECT , [{
                    context: this,
                    cid: $(this).data('cid'),
                    id: $(this).data('id')
                }]);

            $(this).untable().find('button.btn-delete').removeClass('disabled')
            return this;
        },
	 /**
	  * triggers: save.untable.before, save.untable.after
	  * @returns {undefined}
	  */
        save: function(){
            if ( $(this).data('options').readonly ){
                console.warn('Read only. Save is canceled')
                return;
            }

            var update = untable_methods.changed.call(this);
            var add = untable_methods.added.call(this);
            //deleted rows

            if (update.length === 0 && add.length === 0){
                return console.warn('Nothing to save')
            }
            $(this).trigger( TRIGGER.BEFORE.SAVE );

            $(this).find('tbody tr.saved').removeClass('saved')

            ajax_add_config = {
                context: this,
                url: $(this).data('options').rest.url,
                data: {
                    add: add
                },
                type: 'POST',
                beforeSend: function(){
                    console.log('add start')
                    $(this).trigger( TRIGGER.BEFORE.CREATE);
                },
                success: function(res){
                    if (typeof res.added === 'object' && res.added.constructor === Array){
                        for (i = 0; i < res.added.length; i++){
                            var added_row = res.added[i];
                            var row = $(this).data('rows')[ added_row.cid ];

                            if (added_row.status === 'success'){				  
                                 row.added = false;
                                 row.updated = false;
                                 row.deleted = false;
                                 row.id = added_row.id; // <---- new id
                                 console.log('add.success', {
                                        row: row,
                                        added_row: added_row
                                    })
                                 row.datum = $.extend( row.datum, added_row.datum );

                                 $tr = $(this).find('tbody tr[data-cid=' + row.cid + ']');
                                 $tr.attr('data-id', row.id);

                                 $tr
                                     .removeClass('added')
                                     .addClass('saved')

                                 untable_methods.process_row.call(this, $tr, row.datum, row.cid)

                                 console.log('add row', added_row);
                            } else {
                               //add ERROR
                            }
                        } //for
                        $(this).trigger( TRIGGER.UNMODIFIED );
                    } //if
                }
            },

            ajax_update_config = {
                context: this,
                url: $(this).data('options').rest.url,
                data: {
                    update: update
                },
                beforeSend: function(){
                    console.log('update start')
                    $(this).trigger( TRIGGER.BEFORE.UPDATE);
                },
                type: 'PUT',
                success: function(res){
                    if (typeof res.updated === 'object' && res.updated.constructor === Array){
                        var i;
                        for (i=0; i < res.updated.length; i++){
                            var updated_row = res.updated[i];
                            if (updated_row.status === 'saved'){
                                   //remove changed class form tr
                                $(this)
                                    .find('tbody tr[data-id=' + updated_row.id +']')
                                    .removeClass('changed')
                                    .addClass('saved')
                                    .find('td')
                                    .removeClass('changed')
                                    .addClass('saved');

                                 var row = $(this).data('rows')[ updated_row.cid ];

                                     row.datum = $.extend( 
                                        row.datum,
                                        row.changed);

                                     row.changed = false;
                                     $(this).data('rows')[ updated_row.cid ] = row;
                                     var status = {
                                        row: row,
                                        id: row.id,
                                        cid: row.cid
                                     };
                                     $(this).trigger( TRIGGER.AFTER.SAVE , [status])
                            } else {
                                   //save error!
                                   $(this).trigger( TRIGGER.ERROR.SAVE, [

                                   ]);
                            }

                            }//for
                       }
                    $(this).trigger( TRIGGER.AFTER.SAVE);
                    $(this).trigger( TRIGGER.UNMODIFIED );
                }
            };
            
            if (add.length > 0 && update.length > 0){
                $.when(
                    $.ajax(ajax_add_config),
                    $.ajax(ajax_update_config),
                )
                .done(function(){
                  //save complete
                    console.log('save::done all', {
                      arguments: arguments,
                      this: this
                    });
                });
            } 

          if (add.length > 0 && update.length === 0){
               $.ajax(ajax_add_config);
          }

          if (add.length === 0 && update.length > 0){
               $.ajax(ajax_update_config);
          }
        }, //save
         
	'this': function(){
            return $(this);
	},
        
	test: function(){
            console.log('untable.test', {
                'this': this,
                arguments: arguments,
                'jQuery.data': $(this).data()
            });
            return this;
	},
         
        tfoot: function(tfoot){
            var col_name;

            //empty all tfoot cells
            $(this).find('tfoot td').html('&nbsp');

            for ( col_name in tfoot ){
                var col = untable_methods.get_col.call(this, col_name);
                if (col){
                    $(this)
                        .find('tfoot tr td[col-index=' + col.cid + ']')
                        .html( tfoot[col_name] );
                }                 
            }
         },
         
	undo: function(){
            //reset all changed and revert data to cells
            var changed_rows = untable_methods.changed.call(this);
            var added_rows   = untable_methods.added.call(this);
            var status = {
                allowedUndo: true,
                changed_rows: changed_rows,
                added_rows: added_rows
            };
            $(this).trigger( TRIGGER.BEFORE.UNDO, [status]);

            if (status.allowedUndo === false){
                return;
            }

            var i;

            for (i=0; i < changed_rows.length; i++){
                var row_info = changed_rows[i];
                var row = $(this).data('rows')[row_info.cid];

                var $tr = $(this).find('tbody tr[data-id=' + row_info.id + ']');
                if ($tr.length === 1){
                    row.changed = false;
                    $tr = untable_methods.process_row.call(this,$tr, row.datum, row_info.cid);
                } else {
                    $.error('Undo:: $tr not found')
                }
            }

            //addad rows
            $(this).find('tbody tr.added').each(function(){
                var cid = $(this).data('cid');
                $(this).untable().data('rows')[cid] = false;
                $(this).remove();
            });

            $(this).trigger( TRIGGER.AFTER.UNDO );
            $(this).untable('first');
            $(this).trigger( TRIGGER.UNMODIFIED );

	}
    };

    var unselect_methods = {
        init: function(options){	 
            $(this).data('options',
              $.extend(true, {}, $.fn.unselect.defaults, options)
            );

            var init_val = $(this).val();

            //untable extends
            $(this).data('options').untable = 
                $.extend(
                    true, {},
                    $.fn.unselect.defaults.untable,
                    $(this).data('options').untable);

            $(this)
                .attr('type', 'text')		    
                .attr('autocomplete', 'off')		    
                .attr('placeholder', $(this).data('options').placeholder)		    
                .data('value', $(this).data('options').value)		    
                .addClass('unselect')
                .on('keyup', unselect_methods.keyup)
                .on('dblclick', unselect_methods.open)
                .on('keypress', function(){return false;})
                .val( $(this).data('options').displayValue );

            //clone
            if ( $(this).attr('name') && !$(this).data('options').name ){
                $(this).data('options').name = $(this).attr('name');
                $(this).removeAttr('name');
            }

            if ( $(this).val() && !$(this).data('options').value ){
                $(this).data('options').value = $(this).val();
            }


            if ( ! ($(this).data('options').displayValue) && $(this).attr('display_value') ){
                $(this).data('options').displayValue = $(this).attr('display_value');
            }

            if ( $(this).data('options').displayValue ){
                $(this).val( $(this).data('options').displayValue )
            }


            //create hidden field vor real form control value
            $(this).after(
                $('<input type="hidden">')
                    .attr('unselect_uid', $(this).attr('unselect_uid'))
                    .attr('name', $(this).data('options').name)
                    .val( $(this).data('options').value || init_val )
            );
    
            $(this).attr('unselect_uid', untablesCounter++);

              //user triggers in `options.on`

            if ( $(this).data('options').on && typeof $(this).data('options').on === 'object' ){
                for (var trigger_name in $(this).data('options').on){
                    if ( typeof $(this).data('options').on[ trigger_name ] === 'function' )
                        $(this).on( trigger_name, $(this).data('options').on[ trigger_name ] );
                }
            }	 

            $(this).trigger('unselect.before.init');
            return $(this);
        },
        
        val: function(){
            //get dual value from component
            var val = {
                displayValue: $(this).val(),
                value: $(this).data('value')
            };
            return val;
        },
        
        keyup: function(e){ //TEXT PARENT FIELD - NOT TABLE!!!!!
            console.log('unselect::keyup', e.keyCode);

            switch (e.keyCode) {
                case UNTABLE_KEYCODE_13_ENTER:
                case UNTABLE_KEYCODE_40_DOWN:		
                    unselect_methods.open.call(this);
                    e.stopPropagation();
                    break;

                case UNTABLE_KEYCODE_38_UP:
                case UNTABLE_KEYCODE_27_ESCAPE:
                    unselect_methods.close.call(this);
                    break;

                case UNTABLE_KEYCODE_46_DEL: //delete
                    //user must select all text and delete this
                    if ($(this).val() !== '')
                        break;

                    var status = {
                        allowClear: true,
                        value: $(this).data('options').value,
                        displayValue: $(this).data('options').displayValue
                    };

                    $(this).trigger('unselect.before.clear', [status]);


                    if (status.allowClear === true && $(this).val() === '') {		
                        $(this)
                            .val('')
                            .next().val('');

                        $(this).data('options').displayValue = '';
                        $(this).data('value', null);
                        $(this).trigger('change')
                    }
                  break;

                default:
                     break;
            } //switch
            
            $(this).val( $(this).data('options').displayValue );
            return false;
        },
        
        close: function(){
            console.log('unselect::close');
            $('.unselect-lookup')		    
               .remove();

            $('.unselect-opened:last')
               .focus();

            $('.unselect-opened')
               .removeClass('unselect-opened')

            $(this).trigger('unselect.close');
        },
        
        choose: function(){

        },
        
        open: function(e){

            if (e){
                e.stopPropagation();
            }
             
             //delete all
            $('.unselect-lookup').remove();
            $('.unselect-opened')
                .removeClass('unselect-opened');
               
            $(this).addClass('unselect-opened');

            $('body').append(
              $('<div>')
                .addClass('untable unselect-lookup')		  
            );

            console.log('unselect.open');

            console.log({
                position: $(this).position(),
            });
            
            css = {
                position: 'absolute',
                top     : //$(this).position().top
                         0  + $(this).offset().top
                              + $(this).outerHeight(),
                left    : $(this).offset().left,
                width   : $(this).data('options').untable.width || $(this).outerWidth(),
                'background-color': 'white',
            };

            $('.untable.unselect-lookup')
                .css(css)
                .on('mouseleave', function(e){
                    //$(this).trigger('hidelookup')
                    var unselect_uid = $(this).data('unselect_uid');
                    
                    var unselect = $(`[unselect_uid=${unselect_uid}]`);
                    
                    $(unselect).removeClass('unselect-opened');
            
                    $(this).remove();
                })
                .untable( $(this).data('options').untable )
                .data('unselect_uid', $(this).attr('unselect_uid')) //set chain with unselect

            $('.untable.unselect-lookup')
                .focus()
                .on( TRIGGER.CLOSE, function(e,status){
                    console.log('close lookup');
                    var unselect_uid = $(this).data('unselect_uid');
                    var unselect = $(`[unselect_uid=${unselect_uid}]`);

                    $(unselect).removeClass('unselect-opened');
                })
                .on( TRIGGER.CHOOSE, function(e,status){
                    if (status.selected){

                      //set hidden real input			   
                        $('.unselect-opened')
                            .next()
                            .val(status.selected);

                        $('.unselect-opened')
                             .data('options').displayValue = status.displayValue;

                        $('.unselect-opened')
                            .val(status.displayValue)
                            .data('value', status.selected)				  
                            .trigger('change')
                            .removeClass('unselect-opened')
                            .addClass('changed')
                            .focus();
                        }
                });
                
            if ( $(this).data('options').focusFilter === true ){
                $('.untable.unselect-lookup')
                    .find('tr.autofilter input[type="text"]:first').focus();
                }


            $(this).trigger('open');

            console.warn('open lookup untable open element');
        },
        
        'this': function(){
            return this;
        }
    };


    //control element with untable area
    $.fn.unselect = function(){
        var method = undefined;
        var options = {};    

        if (typeof arguments[0] === 'object'){
            options = arguments[0];
            return unselect_methods.init.call(this, arguments[0]);
            }

        if (typeof arguments[0] === 'string'){
            method = arguments[0];
            };

        //check without arguments

        if (arguments.length === 0){
            method = 'this';
            }   

        if (unselect_methods[ method ]){          
            return unselect_methods[method]
                .apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else {
            $.error('Method "$(object).unselect(\'' + method + '\') not found');
        }	   

        return $(this).each(function(){	 
            if ($(this).data('unselect')){
                     //exist
            } else {            
              $(this).data('unselect', true);
              unselect_methods.init.call(this, options);
            }
        });  
    };
  
    //unselect defaults
    $.fn.unselect.defaults = {
        placeholder: '',
        displayField: 'name',
        displayValue: undefined,
        focusFilter: true,
        focusRows  : false,
        name	  : null,
        value	  : null,
        untable: {
            toolbar: false,
            height: 450,
            readonly: true,
            lookupMode: true        
        }    
    };
  
    //Main table element
    $.fn.untable = function(){
        var method = undefined;
        var options = {};

        if (typeof arguments[0] === 'object'){
            options = arguments[0];
            return untable_methods.init.call(this, arguments[0]);
        }

        if (typeof arguments[0] === 'string'){
            method = arguments[0];
        };
        //check without arguments

        if (arguments.length === 0){
            method = 'this';
        }

        if (untable_methods[ method ]){
            if ( $(this).data('untable') ) {            
                return untable_methods[method]
                    .apply( this, Array.prototype.slice.call( arguments, 1 ));
            } else {
                if ( $(this).closest('.untable').length === 1 ){
                    return untable_methods[method]
                     .apply( $(this).closest('.untable')[0], Array.prototype.slice.call( arguments, 1 ));
                } else {
                    $.error('Untable objects not found!!');
                }
            }
        } 
        else {
            $.error('Method "$(object).untable(\'' + method + '\') not found');
        }

        return $(this).each(function(){
            if ($(this).data('untable')){
                //exist
            } else {            
                $(this).data('untable', true);
                untable_methods.init.call(this, options);
            }
        });        
    };
    
    //untable defaults
    $.fn.untable.defaults = {
        allowCreate : true,
        allowDelete : true,
        allowEdit   : true,
        autofilter  : false,
        autoload    : true,
        auto_save   : false,      
        buttons	 : [], //user custom buttons
        cols        : [],
        columns     : true,
        context_menu: true,
        create_template: false,
        data        : [],
        dataPrefix  : null, //for deep of data
        details     : [],
        displayField: 'name',
        draggable   : false,
        focusBorderWidth: 5,
        foreignKey  : null,
        first       : true,
        height      : 600,
        lookupMode  : false,
        filterModel : null,
        multi_select: false,
        pagination  : true,
        rest        : {
            url: null, 
            data: {} },
        primaryKey  : 'id',
        readonly    : false,
        row_indicator: true,
        saveImmediately: false,
        tfoot       : true,
        theadBtn    : false, //thead left indicator cell as a button
        toolbar     : true,
        on		 : null    
    };
})(jQuery);