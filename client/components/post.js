import React, { Component } from 'react';

class Post extends Component {
  constructor(props) {
    super();
  }
  render() {
    let date = new Date(this.props.postTime);
    date = String(date).slice(0,21);
    return (
      <div class = "post">
        <span class = "post-user">
          {this.props.username} ({date}): 
        </span>
        {this.props.post_body}
        <button type = "button" onClick = {() => {this.props.click()}}>X</button>
      </div>
    );
  }
}
export default Post;