const fs = require('fs');

const encodePath = (path) => {
  const bm = fs.readFileSync(path);
  return (new Buffer(bm)).toString('base64');
}

// Request hook to set header on every request
module.exports.requestHooks = [
  context => {
    if (context.request.hasParameter('image')) {
      let path = context.request.getParameter('image');
      let ret;
      try {
        ret = encodePath(path);
      } catch (err) {
        throw new Error(`Cannot encode: ${err.message}`);
      }

      context.request.removeParameter('image');
      let body = context.request.getBody();
      if (body.text !== undefined) {
        body = JSON.parse(body.text);

        if (body['messages'] !== undefined && Array.isArray(body['messages'])) {
          let userdata = {};
          if (body['messages'].length > 1) {
            lastelement = body['messages'].at(-1);
            if (lastelement['role'] === 'user' && lastelement['content'] !== undefined && Array.isArray(lastelement['content'])) {
              userdata = lastelement;
              body['messages'].pop();
            }
            else {
              userdata = {
                'role': 'user',
                'content': []
              };
            }
          }
          else if (body['messages'].length == 1 && body['messages'][0]['role'] === 'system') {
            userdata = {
              'role': 'user',
              'content': []
            };
          }
          if (userdata['role'] === 'user' && userdata['content'] !== undefined && Array.isArray(userdata['content'])) {
            let content = userdata['content'];
            let imagedata = {
              "type": "image_url",
              "image_url": {
                "url": "data:image/jpeg;base64," + ret 
              }
            }

            content.push(imagedata);
            userdata['content'] = content;
            body['messages'].push(userdata);
            context.request.setBody({
              mimeType: 'application/json',
              text: JSON.stringify(body),
            });
            console.log(body);
          }
        }

        if (body['serviceFlow'] !== undefined && Array.isArray(body['serviceFlow']) && body['serviceFlow'][0]['promptGen'] !== undefined && Array.isArray(body['serviceFlow'][0]['promptGen'])) {
          let payload = {};
          if (body['serviceFlow'][0]['promptGen'][0]['payload'] !== undefined) {
            payload = body['serviceFlow'][0]['promptGen'][0]['payload'];
          }
          payload['image'] = "data:image/jpeg;base64," + ret;
          body['serviceFlow'][0]['promptGen'][0]['payload'] = payload;
          context.request.setBody({
            mimeType: 'application/json',
            text: JSON.stringify(body),
          });
          console.log(body);
        }
      }
    }

    if (context.request.hasParameter('cache')) {
      let path = context.request.getParameter('cache');
      let ret;
      try {
        ret = encodePath(path);
      } catch (err) {
        throw new Error(`Cannot encode: ${err.message}`);
      }

      context.request.removeParameter('cache');
      let body = context.request.getBody();
      if (body.text !== undefined) {
        body = JSON.parse(body.text);
        body['cache'] = ret;
        context.request.setBody({
          mimeType: 'application/json',
          text: JSON.stringify(body),
        });
        console.log(body);
      }
    }
  }
];
