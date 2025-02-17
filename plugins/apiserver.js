// Generated by CoffeeScript 1.10.0

/*
 QQBot Api Plugin
 ----------------
 通过HTTP API 方式和QQBot通信
 
 配置依赖：config.yaml
   api_port:  3000
   api_token: '' 设置为 '' 为不需要密码
 
 请求：GET/POST 方法都支持， 参数中token为必备字段
   exp:  GET api/reload_plugin?token=values

 返回：JSON { err:0 , msg:'error msg' } 
   err:0 为成功响应，否则请看错误信息
  
 
 接口：
 ----------------
  1. 发送消息 /send
    type = [buddy,group,discuss]
    to   = 目标名字(不支持空格)
    msg  = 消息文本

  2. 发送图片验证码  /stdin
    value = 验证码

  3. 重新加载插件 /reload
 */

(function() {
  var APIServer, URL, api_server, http, jsons, log, processPost, querystring;

  URL = require('url');

  http = require('http');

  jsons = JSON.stringify;

  log = new (require('log'))('debug');

  querystring = require('querystring');

  processPost = function(request, response, callback) {
    var queryData;
    queryData = "";
    if (typeof callback !== 'function') {
      return null;
    }
    request.on('data', function(data) {
      queryData += data;
      if (queryData.length > 1e6) {
        queryData = "";
        response.writeHead(413, {
          'Content-Type': 'text/plain'
        }).end();
        return request.connection.destroy();
      }
    });
    request.on('end', function() {
      var data;
      if(request.headers) {
        var contentType = request.headers['content-type'];
        if(contentType) {
          if(contentType.indexOf('json') > 0) {
            return callback(JSON.parse(queryData));
          } else if(contentType.indexOf('form-urlencoded') > 0) {
            return callback(querystring.parse(queryData));
          }
        }
      }
      return callback(queryData);
    });
    return request.on('error', function(error) {
      return callback(null, error);
    });
  };

  APIServer = (function() {
    function APIServer(qqbot1) {
      var config, ref;
      this.qqbot = qqbot1;
      config = this.qqbot.config;
      this.http_server = null;
      ref = [config.api_port, config.api_token], this.port = ref[0], this.token = ref[1];
    }

    APIServer.prototype.start = function() {
      return this.http_server = this.create_server(this.port);
    };

    APIServer.prototype.stop = function() {
      if (this.http_server) {
        this.http_server.close();
      }
      this.http_server = null;
      return log.info("aip server stoped");
    };

    APIServer.prototype.create_server = function(port) {
      var server;
      server = http.createServer((function(_this) {
        return function(req, res) {
          var path, query, url;
          log.debug('[api]', req.url);
          url = URL.parse(req.url);
          path = url.pathname;
          if (req.method === 'POST') {
            return processPost(req, res, function(body) {
              return _this.handle_request(req, res, path, body);
            });
          } else if (req.method === 'GET') {
            query = querystring.parse(url.query);
            return _this.handle_request(req, res, path, query);
          }
        };
      })(this));
      server.listen(port, 'localhost');
      log.info('api server started at port', port);
      return server;
    };

    APIServer.prototype.handle_request = function(req, res, path, params) {
      var func;
      res.endjson = function(dict) {
        var key, ret_dict, value;
        if (dict == null) {
          dict = {};
        }
        ret_dict = {
          err: 0,
          msg: 'ok'
        };
        for (key in dict) {
          value = dict[key];
          ret_dict[key] = value;
        }
        res.writeHead(200);
        return res.end(jsons(ret_dict));
      };
      if (this.token && params.token !== this.token) {
        res.endjson({
          err: 503,
          msg: 'token failed'
        });
        return;
      }
      return func = (function() {
        switch (path) {
          case '/stdin':
            return this.on_stdin(req, res, params);
          case '/listbuddy':
            return this.on_listbuddy(req, res, params);
          case '/listgroup':
            return this.on_listgroup(req, res, params);
          case '/listdiscuss':
            return this.on_listdiscuss(req, res, params);
          case '/send':
            return this.on_sendmsg(req, res, params);
          case '/reload':
            return this.on_reload_plugin(req, res, params);
          case '/relogin':
            return this.on_relogin(req, res, params);
          case '/quit':
            return this.on_quit(req, res, params);
          default:
            return res.endjson({
              err: 404,
              msg: 'request not fits'
            });
        }
      }).call(this);
    };

    APIServer.prototype.on_stdin = function(req, res, params) {
      var value;
      value = params.value.trim();
      log.info('stdin value', value);
      process.emit('data', value);
      return res.endjson();
    };

    APIServer.prototype.on_reload_plugin = function(req, res, params) {
      return res.endjson({
        err: 1,
        msg: "method unimplemented"
      });
    };

    APIServer.prototype.on_quit = function(req, res, params) {
      if( req.headers.host.indexOf('localhost') >= 0 ) {
          res.endjson({
            err: 0,
            msg: "ok, qqbot shutdown now."
          });

          console.log("qqbot gracefully shutdown now.\n");
          process.exit(0);

      } else {
          res.endjson({
            err: 403,
            msg: "only accept quit command from localhost."
          });
      }
    };

    APIServer.prototype.on_listbuddy = function(req, res, params) {
        var bot = this.qqbot;
        return bot.update_buddy_list(function(ret, e){
            return res.endjson( bot.buddy_info );
        });
    };

    APIServer.prototype.on_listgroup = function(req, res, params) {
        var bot = this.qqbot;
        return bot.update_group_list(function(ret, e){
            return res.endjson( bot.group_info );
        });
    };

    APIServer.prototype.on_relogin = function(req, res, params) {
        var bot = this.qqbot;
        return bot.relogin(function(ret, e){
            return res.endjson( bot.ret );
        });
    };

    APIServer.prototype.on_listdiscuss = function(req, res, params) {
        var bot = this.qqbot;
        return bot.update_dgroup_list(function(ret, e){
            return res.endjson( bot.dgroup_info );
        });
    };

    APIServer.prototype.on_sendmsg = function(req, res, params) {
      var self = this;
      var discuss_group, group, msg, user;
      log.info("sending " + params.type + " " + params.to + " : " + params.msg);
      if (params.type === 'buddy') {
        if (parseInt(params.to) > 0) {
          return self.qqbot.get_user_uin(params.to, function(err, uin){
            return self.qqbot.send_message(uin, params.msg, function(ret, e) {
              var resp_ret = { result: ret };
              if (e) {
                resp_ret.err = 1;
                resp_ret.msg = "" + e;
              }
              return res.endjson(resp_ret);
            });
          });
        } else {
          user = this.qqbot.get_user_ex({ nick: params.to });
          return this.qqbot.send_message(user, params.msg, function(ret, e) {
            var resp_ret = { result: ret };
            if (e) {
              resp_ret.err = 1;
              resp_ret.msg = "" + e;
            }
            return res.endjson(resp_ret);
          });
        }
      } else if (params.type === 'group') {
        if (parseInt(params.to) > 0) {
          return this.qqbot.get_group_gid(params.to, function(err, gid){
            return self.qqbot.send_message_to_group(gid, params.msg, function(ret, e) {
              var resp_ret = { result: ret };
              if (e) {
                resp_ret.err = 1;
                resp_ret.msg = "" + e;
              }
              return res.endjson(resp_ret);
            });
          });
        } else {
          group = this.qqbot.get_group({ name: params.to });
          return this.qqbot.send_message_to_group(group, params.msg, function(ret, e) {
            var resp_ret = { result: ret };
            if (e) {
              resp_ret.err = 1;
              resp_ret.msg = "" + e;
            }
            return res.endjson(resp_ret);
          });
        }
      } else if (params.type === 'discuss') {
        discuss_group = this.qqbot.get_dgroup({
          name: params.to
        });
        if (!discuss_group) {
          res.endjson({
            err: 501,
            msg: "can't find discuss by name " + params.to
          });
          return;
        }
        return this.qqbot.send_message_to_discuss(discuss_group.did, params.msg, function(ret, e) {
          var resp_ret;
          resp_ret = {
            result: ret
          };
          if (e) {
            resp_ret.err = 1;
            resp_ret.msg = "" + e;
          }
          return res.endjson(resp_ret);
        });
      } else {
        msg = "unimplement type " + params.type;
        log.warning(msg);
        return res.endjson({
          err: 100,
          msg: msg
        });
      }
    };

    return APIServer;

  })();

  api_server = null;

  exports.init = function(qqbot) {
    api_server = new APIServer(qqbot);
    return api_server.start();
  };

  exports.stop = function(qqbot) {
    return api_server.stop();
  };

}).call(this);
