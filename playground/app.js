import React, { Component } from 'react';
import { render } from "react-dom";

// for the autocomplete
import Axios from 'axios';
import Autocomplete from 'react-autocomplete';

import Form from "../src";
import ObjectField from "../src/components/fields/ObjectField"

const log = (type) => console.log.bind(console, type);
const _ = require('lodash');

const schema = {
    type: "object",
    properties: {
      playlist: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { "type" : "string" },
            stream_url: { "type" : "string"},
            artwork_url: { "type" : "string" }
          }
        }
      }
    }
  }


class Search extends React.Component{
  handleRenderItem(item, isHighlighted){
      const listStyles = {
            item: {
                    padding: '2px 6px',
                    cursor: 'default'
                  },
      
            highlightedItem: {
                    color: 'white',
                    background: '#F38B72',
                    padding: '2px 6px',
                    cursor: 'default'
                  }
          };
      return (
            <div
              style={isHighlighted ? listStyles.highlightedItem : listStyles.item}
              key={item.id}
              id={item.id}
            >{item.title}</div>
          )
    }
  render() {
      return (
            <div className="search">
              <label  class="control-label" is="null">Search for a track</label>
              <Autocomplete
               ref="autocomplete"
               inputProps={{title: "Title"}}
               value={this.props.autoCompleteValue}
               items={this.props.tracks}
               getItemValue={(item) => item.title}
               onSelect={this.props.handleSelect}
               onChange={this.props.handleChange}
               renderItem={this.handleRenderItem.bind(this)}
             />
            </div>
          );
    }
}



class TrackField extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = { ...props.formData,
        suggestion: "",
        track: {stream_url: '', title: '', artwork_url: ''},
        tracks: [],
        autoCompleteValue: ''
    };
    this.client_id = '2f98992c40b8edf17423d93bda2e04ab'; 
  }

 // ok, not too sure about this. we've selected, and now we add the result
// to our state and pass it to the onChange
 handleSelect(value, item){
    this.setState({ autoCompleteValue: value, track: item, ...item });    
    // we can just filter out the keys we need for our schema. also ugly
    setImmediate(() => this.props.onChange( _.pick( this.state, Object.keys(this.props.schema.properties)))); 
    console.log(this); 
 }

	// we query soundcloud
  handleChange(event, value){
    console.log(this.props); 
    // Update input box
    this.setState({autoCompleteValue: event.target.value});
    let _this = this;
    //Search for song with entered value
    Axios.get(`https://api.soundcloud.com/tracks?client_id=${this.client_id}&q=${value}`)
      .then(function (response) {
        // Update track state
        _this.setState({tracks: response.data});
      })
      .catch(function (err) {
        console.log(err);
      });
  }

  render() {
    
    return ( 
           <div>
           <Search
                 clientId={this.state.client_id}
                 autoCompleteValue={this.state.autoCompleteValue}
                 tracks={this.state.tracks}
                 handleSelect={this.handleSelect.bind(this)}
                 handleChange={this.handleChange.bind(this)}/>
            <ObjectField {...this.props} />
            
         </div>
         
          );

}

} 

const uiSchema = {
    playlist: {
      items: { 
          "ui:field": "track" 
      } // note the "items" for an array
    }
}

const fields = { track: TrackField }


function validate(formData, errors) {
  console.log(formData);
  console.log(errors);
  return errors;
}

class App extends Component {

render() {
  return (
    <Form schema={schema} uiSchema={uiSchema} fields={fields} onChange={this.onChange}  onSubmit={log(this.state)} validate={validate}  /> 
  );
}
}

render(<App />, document.getElementById("app"));
