import React, { Component } from 'react';
import Switch from 'react-toggle-switch';
import { kanaDictionary } from '../../data/kanaDictionary';
import './ChooseCharacters.scss';
import CharacterGroup from './CharacterGroup';

class ChooseCharacters extends Component {
  state = {
    errMsg : '',
    selectedGroups: this.props.selectedGroups,
    showAlternatives: [],
    showSimilars: [],
    startIsVisible: true
  }

  componentDidMount() {
    this.testIsStartVisible();
    window.addEventListener('resize', this.testIsStartVisible);
    window.addEventListener('scroll', this.testIsStartVisible);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.testIsStartVisible);
    window.removeEventListener('scroll', this.testIsStartVisible);
  }

  componentDidUpdate(prevProps, prevState) {
    this.testIsStartVisible();
  }

  testIsStartVisible = () => {
    if(this.startRef) {
      const rect = this.startRef.getBoundingClientRect();
      if(rect.y > window.innerHeight && this.state.startIsVisible)
        this.setState({ startIsVisible: false });
      else if(rect.y <= window.innerHeight && !this.state.startIsVisible)
        this.setState({ startIsVisible: true });
    }
  }

  scrollToStart() {
    if(this.startRef) {
      const rect = this.startRef.getBoundingClientRect();
      const absTop = rect.top + window.pageYOffset;
      const scrollPos = absTop - window.innerHeight + 50;
      window.scrollTo(0, scrollPos > 0 ? scrollPos : 0);
    }
  }

  getIndex(groupName) {
    return this.state.selectedGroups.indexOf(groupName);
  }

  isSelected(groupName) {
    return this.getIndex(groupName) > -1 ? true : false;
  }

  removeSelect(groupName) {
    if(this.getIndex(groupName)<0)
      return;
    let newSelectedGroups = this.state.selectedGroups.slice();
    newSelectedGroups.splice(this.getIndex(groupName), 1);
    this.setState({selectedGroups: newSelectedGroups});
  }

  addSelect(groupName) {
    this.setState({errMsg: '', selectedGroups: this.state.selectedGroups.concat(groupName)});
  }

  toggleSelect = groupName => {
    if(this.getIndex(groupName) > -1)
      this.removeSelect(groupName);
    else
      this.addSelect(groupName);
  }

  selectAll(whichHangul, altOnly=false, similarOnly=false) {
    const thisHangul = kanaDictionary[whichHangul];
    let newSelectedGroups = this.state.selectedGroups.slice();
    Object.keys(thisHangul).forEach(groupName => {
      if(!this.isSelected(groupName) && (
        (altOnly && groupName.endsWith('_a')) ||
        (similarOnly && groupName.endsWith('_s')) ||
        (!altOnly && !similarOnly)
      ))
        newSelectedGroups.push(groupName);
    });
    this.setState({errMsg: '', selectedGroups: newSelectedGroups});
  }

  selectNone(whichHangul, altOnly=false, similarOnly=false) {
    let newSelectedGroups = [];
    this.state.selectedGroups.forEach(groupName => {
      let mustBeRemoved = false;
      Object.keys(kanaDictionary[whichHangul]).forEach(removableGroupName => {
        if(removableGroupName === groupName && (
          (altOnly && groupName.endsWith('_a')) ||
          (similarOnly && groupName.endsWith('_s')) ||
          (!altOnly && !similarOnly)
        ))
          mustBeRemoved = true;
      });
      if(!mustBeRemoved)
        newSelectedGroups.push(groupName);
    });
    this.setState({selectedGroups: newSelectedGroups});
  }

  toggleAlternative(whichHangul, postfix) {
    let show = postfix == '_a' ? this.state.showAlternatives : this.state.showSimilars;
    const idx = show.indexOf(whichHangul);
    if(idx >= 0)
      show.splice(idx, 1);
    else
      show.push(whichHangul)
    if(postfix == '_a')
      this.setState({showAlternatives: show});
    if(postfix == '_s')
      this.setState({showSimilars: show});
  }

  getSelectedAlternatives(whichHangul, postfix) {
    const prefix = whichHangul == 'vowels' ? 'v_' : (whichHangul == 'consonants' ? 'c_' : 's_');
    return this.state.selectedGroups.filter(groupName => {
      return groupName.startsWith(prefix) &&
        groupName.endsWith(postfix);
    }).length;
  }

  getAmountOfAlternatives(whichHangul, postfix) {
    return Object.keys(kanaDictionary[whichHangul]).filter(groupName => {
      return groupName.endsWith(postfix);
    }).length;
  }

  alternativeToggleRow(whichHangul, postfix, show) {
    let checkBtn = "glyphicon glyphicon-small glyphicon-"
    let status;
    if(this.getSelectedAlternatives(whichHangul, postfix) >= this.getAmountOfAlternatives(whichHangul, postfix))
      status = 'check';
    else if(this.getSelectedAlternatives(whichHangul, postfix) > 0)
      status = 'check half';
    else
      status = 'unchecked'
    checkBtn += status

    return <div
      key={'alt_toggle_' + whichHangul + postfix}
      onClick={() => this.toggleAlternative(whichHangul, postfix)}
      className="choose-row"
    >
      <span
        className={checkBtn}
        onClick={ e => {
          if(status == 'check')
            this.selectNone(whichHangul, postfix == '_a', postfix == '_s');
          else if(status == 'check half' || status == 'unchecked')
            this.selectAll(whichHangul, postfix == '_a', postfix == '_s');
          e.stopPropagation();
        }}
      ></span>
      {
        show ? <span className="toggle-caret">&#9650;</span>
          : <span className="toggle-caret">&#9660;</span>
      }
      {
        postfix == '_a' ? 'Advanced characters (compound vowels, double consonants, syllables..)' :
          'Look-alike characters'
      }
    </div>
  }

  showGroupRows(whichHangul, showAlternatives, showSimilars = false) {
    const thisHangul = kanaDictionary[whichHangul];
    let rows = [];
    Object.keys(thisHangul).forEach((groupName, idx) => {
      if(groupName == "v_group3_a" || groupName == "c_group4_a" || groupName == "s_group7_a")
        rows.push(this.alternativeToggleRow(whichHangul, "_a", showAlternatives));

      if((!groupName.endsWith("a") || showAlternatives) &&
        (!groupName.endsWith("s") || showSimilars)) {
        rows.push(<CharacterGroup
          key={idx}
          groupName={groupName}
          selected={this.isSelected(groupName)}
          characters={thisHangul[groupName].characters}
          handleToggleSelect={this.toggleSelect}
        />);
      }
    });

    return rows;
  }

  startGame() {
    if(this.state.selectedGroups.length < 1) {
      this.setState({ errMsg: 'Choose at least one group!'});
      return;
    }
    this.props.handleStartGame(this.state.selectedGroups);
  }

  render() {
    return (
      <div className="choose-characters">
        <div className="row">
          <div className="col-xs-12">
            <div className="panel panel-default">
              <div className="panel-body welcome">
                <h4>Welcome to Hangul Pro!</h4>
                <p>Please choose the groups of Korean characters that you'd like to be studying.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-sm-4">
            <div className="panel panel-default">
              <div className="panel-heading">Vowels · 모음</div>
              <div className="panel-body selection-areas">
                {this.showGroupRows('vowels', this.state.showAlternatives.indexOf('vowels') >= 0)}
              </div>
              <div className="panel-footer text-center">
                <a href="javascript:;" onClick={()=>this.selectAll('vowels')}>All</a> &nbsp;&middot;&nbsp; <a href="javascript:;"
                  onClick={()=>this.selectNone('vowels')}>None</a>
                &nbsp;&middot;&nbsp; <a href="javascript:;" onClick={()=>this.selectAll('vowels', true)}>All advanced</a>
                &nbsp;&middot;&nbsp; <a href="javascript:;" onClick={()=>this.selectNone('vowels', true)}>No advanced</a>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="panel panel-default">
              <div className="panel-heading">Consonants · 자음</div>
              <div className="panel-body selection-areas">
                {this.showGroupRows('consonants', this.state.showAlternatives.indexOf('consonants') >= 0)}
              </div>
              <div className="panel-footer text-center">
                <a href="javascript:;" onClick={()=>this.selectAll('consonants')}>All</a> &nbsp;&middot;&nbsp; <a href="javascript:;"
                  onClick={()=>this.selectNone('consonants')}>None</a>
                &nbsp;&middot;&nbsp; <a href="javascript:;" onClick={()=>this.selectAll('consonants', true)}>All advanced</a>
                &nbsp;&middot;&nbsp; <a href="javascript:;" onClick={()=>this.selectNone('consonants', true)}>No advanced</a>
              </div>
            </div>
          </div>
          <div className="col-sm-4">
            <div className="panel panel-default">
              <div className="panel-heading">Syllables · 음절</div>
              <div className="panel-body selection-areas">
                {this.showGroupRows('syllables', this.state.showAlternatives.indexOf('syllables') >= 0)}
              </div>
              <div className="panel-footer text-center">
                <a href="javascript:;" onClick={()=>this.selectAll('syllables')}>All</a> &nbsp;&middot;&nbsp; <a href="javascript:;"
                  onClick={()=>this.selectNone('syllables')}>None</a>
                &nbsp;&middot;&nbsp; <a href="javascript:;" onClick={()=>this.selectAll('syllables', true)}>All advanced</a>
                &nbsp;&middot;&nbsp; <a href="javascript:;" onClick={()=>this.selectNone('syllables', true)}>No advanced</a>
              </div>
            </div>
          </div>
          <div className="col-sm-3 col-xs-12 pull-right">
            <span className="pull-right lock">Lock to stage &nbsp;
              {
                this.props.isLocked &&
                  <input className="stage-choice" type="number" min="1" max="4" maxLength="1" size="1"
                    onChange={(e)=>this.props.lockStage(e.target.value, true)}
                    value={this.props.stage}
                  />
              }
              <Switch onClick={()=>this.props.lockStage(1)} on={this.props.isLocked} /></span>
          </div>
          <div className="col-sm-offset-3 col-sm-6 col-xs-12 text-center">
            {
              this.state.errMsg != '' &&
                <div className="error-message">{this.state.errMsg}</div>
            }
            <button ref={c => this.startRef = c} className="btn btn-danger startgame-button" onClick={() => this.startGame()}>Start the Quiz!</button>
          </div>
          <div className="down-arrow"
            style={{display: this.state.startIsVisible ? 'none' : 'block'}}
            onClick={(e) => this.scrollToStart(e)}
          >
            Start
          </div>
        </div>
      </div>
    );
  }
}

export default ChooseCharacters;
