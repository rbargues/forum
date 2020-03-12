import React, { Component } from 'react';

class Thread extends Component {
  constructor(props) {
    super();
  }
  render() {
    return (
      <div>
        <button type = "button" class = "thread" onClick = {this.props.onclick}>
          {this.props.thread_title}
        </button>
      </div>
    );
  }
}

export default Thread;