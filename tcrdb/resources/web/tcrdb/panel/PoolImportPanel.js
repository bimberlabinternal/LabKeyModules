Ext4.define('TCRdb.panel.PoolImportPanel', {
    extend: 'Ext.panel.Panel',

    //TODO: replicate, buffer?
    COLUMNS: [{
        name: 'expt',
        labels: ['Expt', 'Expt #', 'Experiment'],
        allowRowSpan: true,
        alwaysShow: true,
        transform: 'expt',
        allowBlank: false
    },{
        name: 'plateId',
        labels: ['Pool/Tube', 'Pool', 'Pool Num', 'Pool #'],
        allowRowSpan: true,
        alwaysShow: true,
        transform: 'pool',
        allowBlank: false
    },{
        name: 'stimId',
        labels: ['Stim Id'],
        allowRowSpan: false,
        allowBlank: true,
        alwaysShow: true
    },{
        name: 'animalId',
        labels: ['Animal Id', 'SubjectId', 'Subject Id'],
        allowRowSpan: true,
        allowBlank: false
    },{
        name: 'sampleDate',
        labels: ['Sample Date', 'Date'],
        alwaysShow: true,
        allowRowSpan: true,
        transform: 'sampleDate',
        allowBlank: false
    },{
        name: 'effector',
        labels: ['Effectors', 'Effector'],
        alwaysShow: true,
        allowRowSpan: true,
        transform: 'effector',
        allowBlank: false
    },{
        name: 'stim',
        labels: ['Stim'],
        allowRowSpan: false,
        allowBlank: false
    },{
        name: 'stim_num',
        labels: ['Stim #'],
        allowRowSpan: false,
        alwaysShow: true
    },{
        name: 'population',
        labels: ['Population'],
        allowRowSpan: true,
        allowBlank: false
    },{
        name: 'hto',
        labels: ['HTO', 'HTO Oligo', 'HTO-Oligo', 'HTO barcode'],
        allowRowSpan: true,
        transform: 'hto'
    },{
        name: 'cells',
        labels: ['Cells', 'Cell #'],
        allowRowSpan: false,
        allowBlank: false,
        transform: 'cells'
    },{
        name: 'hto_library_index',
        labels: ['HTO Library Index'],
        allowRowSpan: true,
        transform: 'htoIndex'
    },{
        name: 'hto_library_conc',
        labels: ['HTO Library Conc', 'HTO Library Conc (ng/uL)', 'HTO (qubit) ng/uL'],
        allowRowSpan: true
    },{
        name: 'gex_library_index',
        labels: ['5\' GEX Library Index', '5\' GEX Index', 'GEX Index', 'GEX Library Index', '5-GEX Index'],
        allowRowSpan: true,
        transform: 'tenXBarcode'
    },{
        name: 'gex_library_conc',
        labels: ['5\' GEX Library Conc', 'GEX Library Conc', 'GEX Library Conc (ng/uL)', '5\' GEX Conc', 'GEX Conc', 'GEX Conc (ng/uL)', '5\' GEX (qubit) ng/uL'],
        allowRowSpan: true
    },{
        name: 'gex_library_fragment',
        labels: ['5\' GEX Library Fragment Size', 'GEX Library Fragment Size', '5\' GEX Fragment Size', 'GEX Fragment Size', 'GEX Library Fragment Size (bp)'],
        allowRowSpan: true
    },{
        name: 'tcr_library_index',
        labels: ['TCR Library Index', 'TCR Index'],
        allowRowSpan: true,
        transform: 'tenXBarcode'
    },{
        name: 'tcr_library_conc',
        labels: ['TCR Library Conc', 'TCR Library Conc (ng/uL)', 'TCR (qubit) ng/uL', 'TCR library (qubit) ng/uL'],
        allowRowSpan: true
    },{
        name: 'tcr_library_fragment',
        labels: ['TCR Library Fragment Size', 'TCR Library Fragment Size (bp)'],
        allowRowSpan: true
    }],

    transforms: {
        htoIndex: function(val, panel) {
            if (Ext4.isNumeric(val)){
                return 'D' + val;
            }

            return val;
        },

        tenXBarcode: function(val, panel){
            if (!val){
                return;
            }

            val = val.toUpperCase();
            if (!val.match(/^SI-GA-/)) {
                if (val.length > 3) {
                    //errorMsgs.push('Every row must have name, application and proper barcodes');
                }
                else {
                    val = 'SI-GA-' + val;
                }
            }

            return val;
        },

        hto: function(val, panel){
            if (Ext4.isNumeric(val)){
                return 'HTO-' + val;
            }

            return val;
        },

        expt: function(val, panel){
            return val || panel.EXPERIMENT;
        },

        cells: function(val, panel){
            return val ? Ext4.data.Types.INTEGER.convert(val) : val;
        },

        pool: function(val, panel){
            if (panel.EXPERIMENT && Ext4.isNumeric(val) && panel.EXPERIMENT != val){
                return panel.EXPERIMENT + '-' + val;
            }

            return val;
        },

        sampleDate: function(val, panel){
            return val || panel.SAMPLE_DATE;
        },

        effector: function(val, panel){
            return val || panel.EFFECTOR;
        }
    },

    COLUMN_MAP: null,

    initComponent: function () {
        this.COLUMN_MAP = {};
        Ext4.Array.forEach(this.COLUMNS, function(col){
            this.COLUMN_MAP[col.name.toLowerCase()] = col;
            Ext4.Array.forEach(col.labels, function(alias){
                this.COLUMN_MAP[alias.toLowerCase()] = col;
            }, this);
        }, this);

        Ext4.apply(this, {
            title: null,
            border: false,
            defaults: {
                border: false
            },
            items: [{
                layout: {
                    type: 'hbox'
                },
                items: [{
                    xtype: 'ldk-integerfield',
                    style: 'margin-right: 5px;',
                    fieldLabel: 'Current Folder/Workbook',
                    labelWidth: 200,
                    minValue: 1,
                    value: LABKEY.Security.currentContainer.type === 'workbook' ? LABKEY.Security.currentContainer.name : null,
                    emptyText: LABKEY.Security.currentContainer.type === 'workbook' ? null : 'Showing All',
                    listeners: {
                        afterRender: function(field){
                            new Ext4.util.KeyNav(field.getEl(), {
                                enter : function(e){
                                    var btn = field.up('panel').down('#goButton');
                                    btn.handler(btn);
                                },
                                scope : this
                            });
                        }
                    }
                },{
                    xtype: 'button',
                    itemId: 'goButton',
                    scope: this,
                    text: 'Go',
                    handler: function(btn){
                        var wb = btn.up('panel').down('ldk-integerfield').getValue();
                        if (!wb){
                            wb = '';
                        }

                        var container = LABKEY.Security.currentContainer.type === 'workbook' ? LABKEY.Security.currentContainer.parentPath + '/' + wb : LABKEY.Security.currentContainer.path + '/' + wb;
                        window.location = LABKEY.ActionURL.buildURL('tcrdb', 'poolImport', container);
                    }
                },{
                    xtype: 'button',
                    scope: this,
                    hidden: !LABKEY.Security.currentUser.canInsert,
                    text: 'Create Workbook',
                    handler: function(btn){
                        Ext4.create('Laboratory.window.WorkbookCreationWindow', {
                            abortIfContainerIsWorkbook: false,
                            canAddToExistingExperiment: false,
                            controller: 'tcrdb',
                            action: 'poolImport',
                            title: 'Create Workbook'
                        }).show();
                    }
                }]
            }, {
                style: 'padding-top: 10px;',
                html: 'This page is designed to help import TCR/10x data, including pooled samples. Each sample tends to create many libraries with many indexes/barcodes to track.  Use the fields below to download the excel template and paste data to import.<p>'
            },{
                layout: 'hbox',
                items: [{
                    xtype: 'button',
                    text: 'Download Template',
                    border: true,
                    scope: this,
                    href: LABKEY.ActionURL.getContextPath() + '/tcrdb/exampleData/ImportTemplate.xlsx'
                },{
                    xtype: 'button',
                    text: 'Download Example Import',
                    border: true,
                    scope: this,
                    href: LABKEY.ActionURL.getContextPath() + '/tcrdb/exampleData/ImportExample.xlsx'
                }]
            }, {
                xtype: 'ldk-linkbutton',
                text: 'Manage Allowable Values for Stims',
                linkCls: 'labkey-text-link',
                href: LABKEY.ActionURL.buildURL('query', 'executeQuery', Laboratory.Utils.getQueryContainerPath(), {schemaName: 'tcrdb', 'query.queryName': 'peptides'}),
                style: 'margin-top: 10px;'
            },{
                xtype: 'textfield',
                style: 'margin-top: 20px;',
                fieldLabel: 'Expt Number',
                itemId: 'exptNum',
                value: LABKEY.Security.currentContainer.type === 'workbook' ? LABKEY.Security.currentContainer.name : null
            },{
                xtype: 'datefield',
                fieldLabel: 'Sample Date',
                itemId: 'sampleDate'
            },{
                xtype: 'textfield',
                fieldLabel: 'Effectors',
                itemId: 'effector',
                value: 'PBMC'
            },{
                xtype: 'textarea',
                fieldLabel: 'Paste Data Below',
                labelAlign: 'top',
                itemId: 'data',
                width: 1000,
                height: 300
            },{
                xtype: 'button',
                text: 'Preview',
                border: true,
                scope: this,
                handler: this.onPreview
            },{
                style: 'margin-top: 20px;margin-bottom: 10px;',
                itemId: 'previewArea',
                autoEl: 'table',
                cls: 'stripe hover'
            }]
        });

        this.callParent(arguments);
    },

    onPreview: function(btn) {
        var text = this.down('#data').getValue();
        if (!text) {
            Ext4.Msg.alert('Error', 'Must provide the table of data');
            return;
        }

        this.EXPERIMENT = this.down('#exptNum').getValue();
        this.SAMPLE_DATE = this.down('#sampleDate').getValue();
        if (this.SAMPLE_DATE) {
            this.SAMPLE_DATE = Ext4.Date.format(this.SAMPLE_DATE, 'Y-m-d');
        }
        this.EFFECTOR = this.down('#effector').getValue();

        text = Ext4.String.trim(text);
        var rows = LDK.Utils.CSVToArray(text, '\t');
        var colArray = this.parseHeader(rows.shift());
        var parsedRows = this.parseRows(colArray, rows);
        var stimRows = [];
        Ext4.Array.forEach(parsedRows, function(r){
            stimRows.push({
                animalId: r.animalId,
                date: r.sampleDate,
                stim: r.stim,
                treatment: r.treatment || 'None',
                objectId: r.objectId
            });
        }, this);

        Ext4.Msg.wait('Looking for matching stims');
        LABKEY.Ajax.request({
            url: LABKEY.ActionURL.buildURL('tcrdb', 'getMatchingStims', Laboratory.Utils.getQueryContainerPath(), null),
            jsonData: {
                stimRows: stimRows
            },
            scope: this,
            success: LABKEY.Utils.getCallbackWrapper(function(results){
                Ext4.Msg.hide();

                Ext4.Array.forEach(parsedRows, function(r){
                    if (results.rowMap[r.objectId]){
                        r.stimId = results.rowMap[r.objectId];
                    }
                }, this);

                var groupedRows = this.groupForImport(colArray, parsedRows);
                if (!groupedRows){
                    return;
                }

                this.renderPreview(colArray, parsedRows, groupedRows);
            }, this),
            failure: LDK.Utils.getErrorCallback()
        });

    },

    parseHeader: function(headerRow){
        var colArray = [];
        var colNames = {};
        Ext4.Array.forEach(headerRow, function(headerText, idx){
            var colData = this.COLUMN_MAP[headerText.toLowerCase()];
            if (colData){
                colNames[colData.name] = idx;
            }
        }, this);

        Ext4.Array.forEach(this.COLUMNS, function(colData, idx){
            if (colData.alwaysShow || colData.allowBlank === false || colNames[colData.name]){
                colData = Ext4.apply({}, colData);
                colData.dataIdx = colNames[colData.name];

                colArray.push(colData);
            }
        },this);

        return colArray;
    },

    parseRows: function(colArray, rows){
        var lastValueByCol = new Array(colArray.length);
        var ret = [];

        Ext4.Array.forEach(rows, function(row, rowIdx){
            var data = {
                objectId: LABKEY.Utils.generateUUID()
            }

            Ext4.Array.forEach(colArray, function(col, colIdx){
                var cell = Ext4.isDefined(col.dataIdx) ? row[col.dataIdx] : '';
                if (!col){
                    return;
                }

                if (cell){
                    if (col.transform && this.transforms[col.transform]){
                        cell = this.transforms[col.transform](cell, this);
                    }

                    data[col.name] = cell;
                    lastValueByCol[colIdx] = cell;
                }
                else if (col.allowRowSpan && lastValueByCol[colIdx]){
                    data[col.name] = lastValueByCol[colIdx];
                }
                else {
                    //allow transform even if value is null
                    if (col.transform && this.transforms[col.transform]){
                        cell = this.transforms[col.transform](cell, this);
                    }

                    data[col.name] = cell;
                }
            }, this);

            ret.push(data);
        }, this);

        return ret;
    },

    groupForImport: function(colArray, parsedRows){
        var ret = {
            stimRows: [],
            sortRows: [],
            cDNARows: [],
            readsetRows: []
        };
        var hasError = false;

        //stims:
        var stimMap = {};
        var stimIdxs = {};
        var stimIdx = 0;
        Ext4.Array.forEach(parsedRows, function(row){
            var key = this.getStimKey(row);
            if (!stimMap[key]){
                var guid = LABKEY.Utils.generateUUID();
                stimIdx++;

                stimMap[key] = guid;
                stimIdxs[key] = stimIdx;
                ret.stimRows.push({
                    rowId: row.stimId || null,
                    animalId: row.animalId,
                    date: row.sampleDate,
                    stim: row.stim,
                    effector: row.effector,
                    treatment: row.treatment || 'None',
                    objectId: guid,
                    container: LABKEY.Security.currentContainer.id
                });
            }
            else {
                //TODO: sanity check?
            }

            row.stim_num = row.stim_num || stimIdxs[key];
        }, this);

        //sorts:
        var sortMap = {};
        Ext4.Array.forEach(parsedRows, function(row){
            var stimId = stimMap[this.getStimKey(row)];
            var key = this.getSortKey(row);
            if (!sortMap[key]){
                var guid = LABKEY.Utils.generateUUID();
                sortMap[key] = guid;
                ret.sortRows.push({
                    stimGUID: stimId,
                    population: row.population,
                    replicate: row.replicate,
                    cells: row.cells,
                    plateId: row.plateId,
                    well: row.well || 'Pool',
                    hto: row.hto,
                    buffer: row.buffer,
                    objectId: guid,
                    container: LABKEY.Security.currentContainer.id
                });
            }
            else {
                //TODO: sanity check?
            }
        }, this);

        //cDNA/readsets: group by pool
        var poolMap = {};
        Ext4.Array.forEach(parsedRows, function(row) {
            poolMap[row.plateId] = poolMap[row.plateId] || [];
            poolMap[row.plateId].push(row);
        }, this);

        Ext4.Object.each(poolMap, function(poolName, rowArr){
            var readsetGUIDs = {};

            readsetGUIDs.hashingReadsetGUID = this.processReadsetForGroup(poolName, rowArr, ret.readsetRows, 'hto', 'HTO', 'Cell Hashing', null);
            if (!readsetGUIDs.hashingReadsetGUID){
                hasError = true;
                return false;
            }

            readsetGUIDs.readsetGUID = this.processReadsetForGroup(poolName, rowArr, ret.readsetRows, 'gex', 'GEX', 'RNA-seq, Single Cell', '10x 5\' GEX');
            if (!readsetGUIDs.readsetGUID){
                hasError = true;
                return false;
            }

            readsetGUIDs.enrichedReadsetGUID = this.processReadsetForGroup(poolName, rowArr, ret.readsetRows, 'tcr', 'TCR', 'RNA-seq, Single Cell', '10x 5\' VDJ (Rhesus A/B/G)');
            if (!readsetGUIDs.enrichedReadsetGUID){
                hasError = true;
                return false;
            }

            Ext4.Array.forEach(rowArr, function(row) {
                var sortKey = this.getSortKey(row);

                var cDNA = Ext4.apply({
                    sortGUID: sortMap[sortKey],
                    chemistry: null,
                    plateId: row.plateId,
                    well: row.well || 'Pool',
                    container: LABKEY.Security.currentContainer.id
                }, readsetGUIDs);

                ret.cDNARows.push(cDNA);
            }, this);
        }, this);

        return hasError ? null : ret;
    },

    processReadsetForGroup: function(poolName, rowArr, readsetRows, prefix, type, application, librarytype){
        var idxValues = this.getUniqueValues(rowArr, prefix + '_library_index');
        var conc = this.getUniqueValues(rowArr, prefix + '_library_conc');
        var fragment = this.getUniqueValues(rowArr, prefix + '_library_fragment');
        if (idxValues.length === 1){
            var guid = LABKEY.Utils.generateUUID();
            readsetRows.push({
                name: poolName + '-' + type,
                barcode5: idxValues[0],
                concentration: conc[0],
                fragmentSize: fragment[0],
                platform: 'ILLUMINA',
                application: application,
                librarytype: librarytype,
                sampleType: 'mRNA',
                objectId: guid,
                container: LABKEY.Security.currentContainer.id
            });

            return guid;
        }
        else {
            Ext4.Msg.alert('Error', 'Pool ' + poolName + ' uses more than one ' + type + ' index');
            return false;
        }
    },

    getUniqueValues: function(rowArr, colName){
        var ret = [];
        Ext4.Array.forEach(rowArr, function(row){
            if (row[colName])
                ret.push(row[colName]);
        }, this);

        return Ext4.unique(ret);
    },

    renderPreview: function(colArray, parsedRows, groupedRows){
        var target = this.down('#previewArea');
        target.removeAll();

        var columns = [{title: 'Row #'}];
        var colIdxs = [];
        Ext4.Array.forEach(colArray, function(col, idx){
            if (col){
                columns.push({title: col.labels[0], className: 'dt-center'});
                colIdxs.push(idx);
            }
        }, this);

        var data = [];
        var missingValues = false;
        Ext4.Array.forEach(parsedRows, function(row, rowIdx){
            var toAdd = [rowIdx + 1];
            Ext4.Array.forEach(colIdxs, function(colIdx){
                var colDef = colArray[colIdx];
                var propName = colDef.name;

                if (colDef.allowBlank === false && Ext4.isEmpty(row[propName])){
                    missingValues = true;
                    toAdd.push('MISSING');
                }
                else {
                    toAdd.push(row[propName] || 'ND');
                }

            }, this);

            data.push(toAdd);
        }, this);

        var id = '#' + target.getId();
        if ( jQuery.fn.dataTable.isDataTable(id) ) {
            jQuery(id).DataTable().destroy();
        }

        jQuery(id).DataTable({
            data: data,
            pageLength: 500,
            dom: 'rt<"bottom"BS><"clear">',
            buttons: missingValues ? [] : [{
                text: 'Submit',
                action: this.onSubmit,
                rowData: {
                    colArray: colArray,
                    parsedRows: parsedRows,
                    groupedRows: groupedRows,
                    panel: this
                }
            }],
            columns: columns
        });

        target.doLayout();

        if (missingValues){
            Ext4.Msg.alert('Error', 'One or more rows is missing data.  Any required cells without values are marked MISSING');
        }
    },

    onSubmit: function(e, dt, node, config){
        Ext4.Msg.wait('Saving...');
        LABKEY.Ajax.request({
            url: LABKEY.ActionURL.buildURL('tcrdb', 'importTenx', Laboratory.Utils.getQueryContainerPath()),
            jsonData: config.rowData.groupedRows,
            scope: this,
            success: function(){
                Ext4.Msg.hide();
                Ext4.Msg.alert('Success', 'Data Saved', function(){
                    window.location = LABKEY.ActionURL.buildURL('query', 'executeQuery.view', null, {'query.queryName': 'cdnas', schemaName: 'tcrdb'})
                }, this);
            },
            failure: LDK.Utils.getErrorCallback()
        });
    },

    getStimKey: function(data){
        return [data.stimId, data.animalId, data.stim, data.treatment].join('|');
    },

    getSortKey: function(data){
        return [this.getStimKey(data), data.population, data.hto].join('|');
    }
});