define(function(require) {
  var QuestionView = require('core/js/views/questionView');
  var Adapt = require('core/js/adapt');
  var Sortable = require('../libraries/sortable.umd');
  var SentenceOrderingView = QuestionView.extend({

    sortable: null,

    //method for setting up questions before rendering
    setupQuestion: function() {
      this.listenTo(Adapt, 'device:resize', this.resizeItems, 200);
      this.model.setupRandomisation();
    },

    // methods after the question is rendered
    onQuestionRendered: function() {
      this.setReadyStatus();
      this.setHeight();
      this.resizeItems();
      this.showMarking();
      if (!this.model.get('_isPrefixTitle')) this.$('.sentence__container').width('100%');
      //first time html structure
      this.model.set('_sentenceListHtml', this.$("ul[data-id='sortable']").html());
      this.model.set('_sentenceListJqueryObject', this.$("ul[data-id='sortable']"));
      this.sortSentenceInitialize();
    },

    sortSentenceInitialize: function(event) {
      if (this.model.get("_isSubmitted")) return;
      var self = this;
      if (event && event.preventDefault) {
        event.preventDefault();
      }
      var sortableContainer = this.model.get('_sentenceListJqueryObject')[0];
      
      this.sortable = Sortable.create(sortableContainer, {
        disabled: false,
        draggable: '.sentenceOrdering__item',
        filter: '.is-locked',
        ghostClass: 'sortable-ghost',
        animation: 150
      });
    },

    setDefaultHeight: function() {
      this.$('.sentenceOrdering__container-inner').css({
        'min-height': 'auto'
      });
      this.setHeight();
    },

    getMaxHeight: function($Elements) {
      var maxItemHeight = $Elements.map(function(i,e){
        return $(e).outerHeight(true);
      }).get().reduce(function(a,b) {
        return Math.max(a,b);
      });

      return maxItemHeight;
    },

    setHeight: function() {
      // on a vertical list we need to set the height of the container to allow equal height items
      if (this.model.get('_isHorizontal') === false) {
        var items = this.$('.sentenceOrdering__prefix-item,.sentenceOrdering__item');
        var maxItemHeight = this.getMaxHeight(items);

        var containerHeight = Math.ceil(maxItemHeight * (items.length/2));

        this.$('.sentenceOrdering__container-inner').css({
            'min-height': containerHeight
        });
      }
    },

    resizeItems: function() {
      this.setDefaultHeight();
    },

    disableQuestion: function() {
      this.sortable.option('disabled', true);
    },

    enableQuestion: function() {
      this.sortable.option('disabled', false);
    },

    // Blank method to add functionality for when the user cannot submit
    // Could be used for a popup or explanation dialog/hint
    onCannotSubmit: function() {},

    onSubmitted: function() {
      var numberOfIncorrectAnswers = this.model.get('_numberOfIncorrectAnswers');
      var attemptsLeft = this.model.get('_attemptsLeft');
      if (attemptsLeft !== 0 && numberOfIncorrectAnswers > 0)
        this.model.get('_sentenceListJqueryObject').children('li').removeClass('is-correct is-incorrect').addClass('is-incorrect-resettable');
    },

    // This is important and should give the user feedback on how they answered the question
    // Normally done through ticks and crosses by adding classes
    showMarking: function() {
      if (!this.model.get('_canShowMarking') || !this.model.get('_isSubmitted')) return;
      var $sentences = this.$('.sentenceOrdering__item');
      _.each(this.model.get('isItemOnCorrectPlace'), function(isCorrectItem, index) {
        var $item = $sentences.eq(index);
        $item.removeClass('is-correct is-incorrect').addClass(isCorrectItem ? 'is-correct' : 'is-incorrect')
      }, this);
    },

    showCorrectAnswer: function() {
      var listElements = [],
        cloneElement = this.model.get('_sentenceListJqueryObject').children().clone();
      cloneElement.sort(function(firstEle, secondEle) {
          return parseInt(firstEle.dataset.itemid) - parseInt(secondEle.dataset.itemid);
      }).each(function() {
        listElements.push(this)
      });
      this.model.get('_sentenceListJqueryObject').html(listElements);
      this.setDefaultHeight();
    },

    hideCorrectAnswer: function() {
      this.model.get('_sentenceListJqueryObject').html(this.model.get('userSortedList') || this.model.get('_sentenceListHtml'));
      this.setDefaultHeight();
    },

    // Used by the question view to reset the look and feel of the component.
    resetQuestion: function() {
      //this.model.resetItems();
      if (this.model.get('_sentenceListHtml'))
        this.model.get('_sentenceListJqueryObject').html(this.model.get('_sentenceListHtml'));
    },

    /**
     * used by adapt-contrib-spoor to get the user's answers in the format required by the cmi.interactions.n.student_response data field
     * returns the user's answers as a string in the format "1,5,2"
     */
    getResponse: function() {
      var userAnswer = this.model.get('_userAnswer');
      var responses = [];
      for (var i = 0, count = userAnswer.length; i < count; i++) {
        responses.push((i + 1) + "." + (userAnswer[i])); // convert from 0-based to 1-based counting
      };
      return responses.join('#');
    },

    /**
     * Used by adapt-contrib-spoor to get the type of this question in the format required by the cmi.interactions.n.type data field
     */
    getResponseType: function() {
      return "matching";
    }

  });

  return SentenceOrderingView;

});