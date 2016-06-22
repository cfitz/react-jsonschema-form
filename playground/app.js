import React, { Component } from 'react';
import { render } from "react-dom";

// for the autocomplete
import Axios from 'axios';
import Autocomplete from 'react-autocomplete';

import Form from "../src";

import { getDefaultFormState, getDefaultRegistry, retrieveSchema, setState }  from "../src/utils";

const log = (type) => console.log.bind(console, type);
const _ = require('lodash');


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
            <div>
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


// this is a stand-in for the array field. 
// it adds the search component, then passes off the data to the
// regular array field
class TrackField extends React.Component {
  
  constructor(props) {
    super(props);
    this.state = this.getStateFromProps(props);  
    this.client_id =  '2f98992c40b8edf17423d93bda2e04ab'; 
  }


  componentWillReceiveProps(nextProps) {
    this.setState(this.getStateFromProps(nextProps));
  }

  getStateFromProps(props) {
    const formData = Array.isArray(props.formData) ? props.formData : null;
    const {definitions} = this.props.registry;
    return {
      items: getDefaultFormState(props.schema, formData, definitions) || [],
      value: "", 
      suggestion: "",
      track: {stream_url: '', title: '', artwork_url: ''},
      tracks: [],
      autoCompleteValue: '' 
    };
  } 

  asyncSetState(state, options={validate: false}) {
    setState(this, state, () => {
      this.props.onChange(this.state.items, options);
    });
  }

 // when we select on the search, we update our state with an added item to items.
 handleSelect(value, item){
    const {items} = this.state;
    const { schema } = this.props; 
    const filteredItem = _.pick( item, Object.keys(schema.items.properties)); 
    
    this.asyncSetState({
      autoCompleteValue: "",  
      items: items.concat([filteredItem]) 
    }); 
 }

	// somethings been entered in the text box, so we query soundcloud
  handleChange(event, value){
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
    const {
      uiSchema,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly
    } = this.props;
    const {definitions, fields} = this.props.registry;
    const {SchemaField, TitleField, DescriptionField} = fields;
    const schema = retrieveSchema(this.props.schema, definitions);
    const title = schema.title || name;
    // we need to update the uiSchema with the default ui:field to avoid recursion  
    const uiSchema2 = { ...uiSchema,  "ui:field" : schema.type}; 
   console.log(idSchema); 
   return (
     <div> 
      <Search
          clientId={this.state.client_id}
          autoCompleteValue={this.state.autoCompleteValue}
          tracks={this.state.tracks}
          handleSelect={this.handleSelect.bind(this)}
          handleChange={this.handleChange.bind(this)}/>  
      
      <SchemaField 
        required={required}
        schema={schema}
        uiSchema={uiSchema2}
        errorSchema={errorSchema}
        idSchema={idSchema}
        formData={this.state.items}
        onChange={this.props.onChange}
        registry={this.props.registry}
        disabled={disabled}
        readonly={readonly} />
      </div> 
    );
 }
}


const fields = { track: TrackField }


function validate(formData, errors) {
  log(formData);
  log(errors);
  return errors;
}

const uiSchema = {
    playlist: {
      "ui:field": "track",
    }
}


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
            artwork_url: { "type" : "string" },
            user: {
              type: "object",
              properties: {
                username: { type: "string" },
                permalink_url: { type: "string" }
              } 
            } 
          }
        }
      }
    }
  };


class App extends Component {

render() {
  return (
    <Form schema={schema} uiSchema={uiSchema} fields={fields} onChange={this.onChange}  onSubmit={log(this.state)} validate={validate}  /> 
  );
}
}

render(<App />, document.getElementById("app"));
