/* jshint undef: true, unused: true, browser: true, quotmark: single, curly: true */
/* global Ext */
Ext.define('Emergence.touch.proxy.Records', {
    extend: 'Jarvus.touch.proxy.API',
    alias: 'proxy.records',
    requires: [
        'Emergence.touch.util.API'
    ],

    config: {
        /**
         * @cfg (required)
         * The base URL for the managed collection (e.g. '/people')
         */
        url: null,

        /**
         * @cfg {"*"/String/String[]}
         * Dynamic fields to ask server to include with responses
         */
        include: null,

        /**
         * @cfg {String/String[]}
         * Related tables to ask server to include with responses
         */
        relatedTable: null,

        /**
         * @cfg {Boolean} [summary=false]
         * True to only include summary fields for serialized objects
         */
        summary: false,


        connection: 'Emergence.touch.util.API',


        pageParam: false,
        startParam: 'offset',
        limitParam: 'limit',
        sortParam: 'sort',
        simpleSortMode: true,
        reader: {
            type: 'json',
            rootProperty: 'data',
            totalProperty: 'total',
            messageProperty: 'message'
        },
        writer:{
            type: 'json',
            rootProperty: 'data',
            writeAllFields: false,
            allowSingle: false
        }
    },

    buildUrl: function(request) {
        var me        = this,
            operation = request.getOperation(),
            records   = operation.getRecords() || [],
            record    = records[0],
            model     = me.getModel(),
            idProperty= model.getIdProperty(),
            url       = me.getUrl(request),
            params    = request.getParams() || {},
            id        = (record && !record.phantom) ? record.getId() : params[idProperty];

        switch(request.getAction()) {
            case 'read':
                if (id) {
                    url += '/' + encodeURIComponent(id);
                    delete params[idProperty];
                }
                break;
            case 'create':
            case 'update':
                url += '/save';
                break;
            case 'destroy':
                url += '/destroy';
                break;
        }

        request.setUrl(url);

        return me.callParent([request]);
    },

    getParams: function() {
        var me = this,
            include = me.getInclude(),
            relatedTable = me.getRelatedTable(),
            summary = me.getSummary(),
            params = me.callParent(arguments);

        if (include) {
            params.include = Ext.isArray(include) ? include.join(',') : include;
        }

        if (relatedTable) {
            params.relatedTable = Ext.isArray(relatedTable) ? relatedTable.join(',') : relatedTable;
        }

        if (summary) {
            params.summary = 'true';
        }

        return params;
    }
});