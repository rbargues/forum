import React, { Component } from 'react';
import Thread from "./thread.js";
import Post from "./post.js"
class App extends Component {
  constructor() {
    super();
    this.state = {
      loggedIn: false,
      threads: [],
      threadToPost: "",
      posts: [],
      user: "",
      threadRender: false
    }
    if (document.cookie) {
      if (document.cookie.split("=")[0] === "username_plain") {
        this.state.loggedIn = true;
        this.state.user = document.cookie.split("=")[1];
        this.state.user = this.state.user.replace(/%20/g, " ");
      }
    }
    this.logOut = this.logOut.bind(this);
    this.obtainPosts = this.obtainPosts.bind(this);
    this.login = this.login.bind(this);
    this.obtainThreads = this.obtainThreads.bind(this);
    this.makeThread = this.makeThread.bind(this);
    this.register = this.register.bind(this);
    this.deletePost = this.deletePost.bind(this);
  }
  logOut() {
    fetch("/logout")
    .then(() => {
      const newState = {...this.state};
      newState.loggedIn = false;
      newState.threads = [];
      newState.threadToPost = "";
      newState.posts = [];
      newState.user = "";
      newState.threadRender = false;
      this.setState(newState);
    })
  }
  obtainPosts(id) {
    fetch(`/getthread/${id}`)
    .then(res => res.json())
    .then(json => {
      const newState = {...this.state};
      newState.posts = json;
      newState.threadToPost = id;
      newState.threadRender = true;
      this.setState(newState);
    })
  }
  obtainThreads(username) {
    fetch("/getallthreads")
    .then(res => res.json())
    .then(json => {
      const newState = {...this.state};
      newState.threads = json;
      newState.loggedIn = true;
      newState.user = username;
      this.setState(newState);
    })
  }
  makeThread() {
    let thread_title = document.getElementById("makethread").value;
    document.getElementById("makethread").value = "";
    fetch("/makethread", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({thread_title: thread_title})
    })
    .then(res => res.json())
    .then(json => {
      if (json.message === "made a thread") {
        this.obtainThreads(this.state.user);
      }
      
    })
  }
  register() {
    let username = document.getElementById("username").value;
    // username = username.replace(/\s/g, "X");
    let password = document.getElementById("password").value;
    document.getElementById("password").value = "";
    fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({username: username, password: password})
    })
    .then(res => {
      return res.json();
    })
    .then(json => {
      if (json.message === "user created") {
        this.obtainThreads(username);
      }
    });
  }
  login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    document.getElementById("password").value = "";
    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({username: username, password: password})
    })
    .then(res => {
      return res.json();
    })
    .then(json => {
      if (json.message === "you can log in") {
        this.obtainThreads(username);
        // this.setState({loggedIn: true,
        // });
      }
    });
  }
  makePost() {
    let postBody = document.getElementById("makepost").value;
    document.getElementById("makepost").value = "";
    fetch("/makepost", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: this.state.user,
        thread_id: this.state.threadToPost,
        post_body: postBody
      })
    })
    .then(res => res.json())
    .then(json => {
      if (json.message === "made a post") {
        this.obtainPosts(this.state.threadToPost);
      }
    })
  }
  deletePost(post_id) {
    fetch(`/deletePost/${post_id}`,{
      method: "DELETE",
      heades: {
        "Content-Type": "application/json",
      }
    })
    .then(res => res.json())
    .then(json => {
      if (json.message === "post deleted") {
        this.obtainPosts(this.state.threadToPost);
      }
    })
  }
  render() {
    
    if (!this.state.loggedIn) {
      return (
      <div>
        <input type = "text" id = "username" placeholder = "username"></input>
        <input type = "text" id = "password" placeholder = "password"></input>
        <button type = "button" onClick = {() => {this.login()}}>Log In</button>
        <button type = "button" onClick = {() => {this.register()}}>Register</button>
      </div>
      );
    }
    else {
      if (this.state.threadRender) {
        const posts = [];
        for (let i = 0; i < this.state.posts.length; i++) {
          posts.push(<Post post_body = {this.state.posts[i].post_body} username = {this.state.posts[i].username} postTime = {this.state.posts[i].post_time} click = {() => this.deletePost(this.state.posts[i].post_id)}/>);
        }
        return (
          <div>
            {posts}
            <input id = "makepost" placeholder = "post body"></input>
            <button type = "button" onClick = {() => {this.makePost()}}>Make Post</button>
            <button type = "button" onClick = {() => {this.logOut()}}>Log Out</button>
          </div>
        );
      }
      if (this.state.threads.length === 0) {
        this.obtainThreads(this.state.user);
      }
      const threads = [];
      for (let i = 0; i < this.state.threads.length; i ++) {
        threads.push(<Thread onclick = {()=>{this.obtainPosts(this.state.threads[i].thread_id)}} thread_id = {this.state.threads[i].thread_id} thread_title = {this.state.threads[i].thread_title}/>)
      }
      return (
        <div>
          {threads}
          <input id = "makethread" placeholder = "thread title"></input>
          <button type = "button" onClick = {() => {this.makeThread()}}>Make Thread</button>
          <button type = "button" onClick = {() => {this.logOut()}}>Log Out</button>
        </div>  
        );
    }    
  }
}

export default App;