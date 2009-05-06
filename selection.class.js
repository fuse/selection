/**
* Selection class, version 0.1.1 by Martin <martin@noremember.org>
*
* Selection is a class which provides easy way to control
* selected text over an input or a textarea.
* This class is cross browsers and is based on prototype.
*
* Unit's tests has been running on :
*   - Firefox 2.0.0.8
*   - Opera 9.24
*   - Internet Explorer 6
*   - Internet Explorer 7
*   - Safari 3.0.3
*
* Known issue : selection{end|Start} works fine with
* textarea on Konqueror, but not with inputs where
* end == start sometimes.
*/

Selection = function(item) {
  this._input = 'string' == typeof item ? $(item) : item;
  this._startAt = 0;
  this._endAt = 0;


  if(this.isValidInput()) {
    if(Prototype.Browser.IE) {
      if("TEXTAREA" == this.inputNodeName()) {
        var range = document.selection.createRange();
        var selectionLength = range.text.length;

        if(selectionLength > 0) {
          var store = range.duplicate();
          // set up the start index at the beginning of the textarea
          store.moveToElementText(this._input);
          // set up the end index at the end of the selected range
          store.setEndPoint('EndToEnd', range);
          this._startAt = store.text.length - selectionLength;
          this._endAt = this.startAt() + selectionLength;
        }
      } else {
        // INPUT
        var range = document.selection.createRange();
        var start = 0;

        navigator.appVersion.indexOf("MSIE 7.0") == -1 ?
        start = range.getBookmark().charCodeAt(2) - 2 :
        start = range.getBookmark().charCodeAt(2) - 3;

        this._startAt = start > 0 ? start : 0;
        this._endAt = this.startAt() + range.text.length;
      }
    } else {
      this._endAt = this.input().selectionEnd;
      this._startAt = this.input().selectionStart;
    }
  }
}; // Selection constructor

Selection.prototype = {
  /**
   * Returns the character found at the index position, only if index
   * is valid.
   */
  charAt: function(index) {
    if(this.isValid() && index >= 0 && index < this.length())
      return this.getText().substring(index, index + 1);
    return false;
  },

  /**
   * Cut selected text by replacing it by an empty string.
   */
  cut: function() {
    if(this.isValid())
      this.setText("");
  },

  /**
   * Returns end position of the selection.
   */
  endAt: function() {
    return this._endAt;
  },

  /*
   * Returns selected text.
   */
  getText: function() {
    if(this.isValid())
      return this.inputValue().substring(this.startAt(), this.endAt());
    return new String();
  },

  /**
   * Returns the input where selection has been done.
   */
  input: function() {
    return this._input;
  },

  /**
   * Returns the nodeName of the parentNode selection.
   */
  inputNodeName: function() {
    return (this.isValidInput()) ? this.input().nodeName : "";
  },

  /**
   * Returns the value of the parentNode selection.
   */
  inputValue: function() {
    return (this.isValidInput()) ? this.input().value : "";
  },

  /**
   * Insert a string after the selection.
   */
  insertAfter: function(text) {
    this.insertAt(text, this.length());
  },

  /**
   * Insert a string at the index of the selection and
   * return old input's value. Indexes are also
   * updated if the selection is still valid.
   * (IE : insert has been done after or before the selection,
   *  not inside.)
   */
  insertAt: function(text, index) {
    var value = this.inputValue();
    var length = this.length();

    if(this.isValid() && index >= 0 && index <= length && ! text.empty()) {
      this.input().value = value.substring(0, this.startAt() + index) +
                           text +
                           this.getText().substring(index, this.endAt()) +
                           value.substring(this.endAt(), value.length);

      if(0 == index) {
        // Insert before : we must update the indexes.
        // We use cached value of length because it's calculated
        // with start and length.
        this._startAt += text.length;
        this._endAt += text.length;
      } else if(index < length)
        // Insert in the text : selection is no longer valid,
        // unreferences input's pointer.
        this.unvalidate();
      // Insert after the text : indexes does'nt change.
      }
      // return previous value
      return value;
    },

  /**
   * Insert a string before the selection.
   */
  insertBefore: function(text) {
    this.insertAt(text, 0);
  },

  /**
   * Returns true if the input is valid.
   */
  isValidInput: function() {
    if(![null, 'undefined'].include(this.input()))
      return $(['TEXTAREA', 'INPUT']).include(this.input().nodeName);
    return false;
  },

  /**
   * Returns true if the input and the selection are valid.
   */
  isValid: function() {
    return this.isValidInput() && 0 < this.length() &&
           this.startAt() >= 0 && this.endAt() <= this.inputValue().length;
  },

  /**
   * Returns the difference between end and start indexes.
   */
  length: function() {
    if(this.isValidInput() && this.endAt() > this.startAt() &&
       this.startAt() >= 0 && this.endAt() <= this.inputValue().length)
      return (this.endAt() - this.startAt());
    return 0;
  },

  /**
   * End index can't me smaller than the size of the selected word,
   * and longer than the total length.
   */
  setEndAt: function(index) {
    var previousIndex = this.endAt();
    if(this.isValid())
      if(index > this.startAt() && index <= this.inputValue().length) {
        this._endAt = index;
        return previousIndex;
      }
    return false;
  },

  /**
   * Start index can't me smaller than 0 and longer than the total length
   * minus the word length.
   */
  setStartAt: function(index) {
    var previousIndex = this.startAt();
    if(this.isValid())
      if(index >= 0 && index < this.endAt()) {
        this._startAt = index;
        return previousIndex;
      }
    return false;
  },

  /**
   * Replace the previous text with the text given in argument if the
   * selection is valid, false otherwise.
   * SetText update end index and return previous text.
   */
  setText: function(text) {
    if(this.isValid()) {
      var previousText = this.getText();
      var value = this.inputValue();

      this.input().value = value.substring(0, this.startAt()) +
                           text +
                           value.substring(this.endAt(), value.length);

        // can't use setEntAd because it can be unvalid.
        // Ex : replace foobar by foo
        // Current endAt is more far than length => isValid == false
        this._endAt = (this.startAt() + text.length);
        return previousText;
      }
      return false;
    },

  /**
   * Returns start position of the selection.
   */
  startAt: function() {
    return this._startAt;
  },

  /**
   * Unvalidate the selection by dereferencing the input.
   * For example, if you insert character in the selection,
   * the selection is no longer valid.
   */
  unvalidate: function() {
    var previousInput = this.input();
    this._input = null;
    return previousInput;
  }
}; // Selection methods
