/* jshint undef: true, unused: true, browser: true, quotmark: single, curly: true */
/* global Ext */

/**
 * @abstract
 * An abstract class for singletons that facilitates communication with backend services on a local or remote emergence server
 */
Ext.define('Emergence.touch.util.AbstractAPI', {
    extend: 'Jarvus.touch.util.AbstractAPI',

    config: {
        userModel: null,

        user: null,

        /**
         * @cfg
         * `include` string to use when loading the session from the server
         */
        userInclude: null,

        /**
         * @cfg
         * The currently loaded session
         */
        sessionData: null
    },


    /**
     * @event
     * Fires after successful login
     * @param {Object} sessionData
     */


    // @inheritdoc
    buildUrl: function(path, options) {
        var include = options && options.include,
            url = this.callParent(arguments);

        if (include) {
            url = Ext.String.urlAppend(url, Ext.Object.toQueryString({
                include: Ext.isArray(include) ? include.join(',') : include
            }));
        }

        return url;
    },

    // @inheritdoc
    buildHeaders: function(headers) {

        if (!('Accept' in headers)) {
            headers.Accept = 'application/json';
        }

        return headers;
    },

    updateSessionData: function(sessionData) {
        var me = this,
            userData = sessionData.Person;

        if (userData) {
            me.setUser(userData);
        }

        if (sessionData.PersonID) {
            me.fireEvent('login', sessionData, me.getUser());
        }
    },

    applyUser: function(user) {
        var me = this,
            userModel = me.getUserModel(),
            existingUser;

        if (userModel && !user.isModel) {
            // don't create a new user model instance if one already exists and its ID matches
            if (user.ID && (existingUser = me.getUser()) && user.ID == existingUser.getId()) {
                existingUser.setData(user);
                user = existingUser;
            } else {
                user = Ext.create(userModel, user);
            }
        }

        return user || null;
    },

    updateUser: function(user, oldUser) {
        this.fireEvent('userchange', user, oldUser);
    },

    applyUserInclude: function(include) {
        if (include != '*' && !Ext.isArray(include)) {
            include = include.split(',');
        }

        return include;
    },

    getSessionInclude: function() {
        var userInclude = this.getUserInclude();

        if (!userInclude) {
            return 'Person';
        }

        if (userInclude == '*') {
            return 'Person.*';
        }

        if (Ext.isString(userInclude)) {
            userInclude = userInclude.split('+');
        }

        return Ext.Array.map(userInclude, function(include) {
            return 'Person.' + include;
        });
    },

    /**
     * Attempt to load session data
     * @param {String} hostname
     * @param {String} username
     * @param {String} password
     * @param {Function} callback A function to call and pass the new client data to when it is available
     * @param {Object} scope Scope for the callback function
     */
    getSessionData: function(callback, scope) {
        var me = this;

        me.request({
            url: '/login',
            method: 'GET',
            include: me.getSessionInclude(),
            success: function(response) {
                if(response.data && response.data.success) {
                    me.setSessionData(response.data.data);
                    Ext.callback(callback, scope, [true, response]);
                }
                else {
                    Ext.callback(callback, scope, [false, response]);
                }
            },
            exception: function(response) {
                Ext.callback(callback, scope, [false, response]);
            }
        });
    },

    /**
     * Login to a user account
     * @param {String} hostname
     * @param {String} username
     * @param {String} password
     * @param {Function} callback A function to call and pass the new client data to when it is available
     * @param {Object} scope Scope for the callback function
     */
    login: function(username, password, callback, scope) {
        var me = this;

        me.request({
            url: '/login',
            include: me.getSessionInclude(),
            params: {
                '_LOGIN[username]': username,
                '_LOGIN[password]': password,
                '_LOGIN[returnMethod]': 'POST'
            },
            success: function(response) {
                if (response.data && response.data.success) {
                    me.setSessionData(response.data.data);
                    Ext.callback(callback, scope, [true, response]);
                } else {
                    Ext.callback(callback, scope, [false, response]);
                }
            },
            exception: function(response) {
                Ext.callback(callback, scope, [false, response]);
            }
        });
    },

    /**
     * Logout from a user account
     * @param {Function} callback A function to call and pass the new client data to when it is available
     * @param {Object} scope Scope for the callback function
     */
    logout: function(callback, scope) {
        this.request({
            url: '/login/logout',
            success: function(response) {
                Ext.callback(callback, scope, [true, response]);
            },
            exception: function(response) {
                Ext.callback(callback, scope, [false, response]);
            }
        });
    },


    /**
     * Register a user account
     * @param {Function} callback A function to call and pass the new client data to when it is available
     * @param {Object} scope Scope for the callback function
     */
    register: function(data, callback, scope) {
        var me = this,
            include = me.getUserInclude();

        if (!Ext.Array.contains(include, 'validationErrors')) {
            include = Ext.Array.clone(include);
            include.push('validationErrors');
        }

        if (data.Password && !data.PasswordConfirm) {
            data.PasswordConfirm = data.Password;
        }

        me.request({
            method: 'POST',
            url: '/register',
            params: data,
            include: include,
            success: function(response) {
                if (response.data && response.data.success) {
                    me.setUser(response.data.data);
                    Ext.callback(callback, scope, [true, response]);
                } else {
                    Ext.callback(callback, scope, [false, response]);
                }
            }
        });
    },

    recoverPassword: function(username, callback, scope) {
        var me = this;

        me.request({
            method: 'POST',
            url: '/register/recover',
            params: {
                username: username
            },
            success: function(response) {
                Ext.callback(callback, scope, [response.data && response.data.success, response]);
            }
        });
    }
});