import React, { Component } from 'react';


function wrapComponent(Component, props) {
    return React.Component({
      render: function() {
        return React.createElement(Component, props);
      }
    });
};

export default wrapComponent;