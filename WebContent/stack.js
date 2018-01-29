class Stack {

    static getStack(div) {
        var stackNo = $(div).data("card-info").col;
        return stacks[stackNo];
    }
    
    static pip(cardIndex) {
        return cardIndex % 13 + 2;
    }
    
    constructor(col) {
        this.width = 8;
        this.padding = 0.25;
        this.col = col;
        this.childDivs = [];
        var id = "col" + col;
        var theHtml = "<div id=" + id + "></div>";
        var colDiv = $(theHtml).clone();
        $("div#table").append(colDiv);
        this.pushBlank();
    }
    
    addAttributes(div, index) {
        var card = (index == -1) ? "blank.svg" : cards[index%52];
        
        div.data("card-info", 
            { 
                col:this.col,
                index:index,
                card:card
            });
    }

//    canMove() {
//        // pop moveable cards to 'moveable', but remember to put them back at the end of routine
//        var moveable = new Stack();
//        var top = this.cards.pop();
//        for(var i = 0; i < 10; i++) {
//            moveable.push(top);
//            var next = this.cards.pop();  // might be undefined, but if statement below will work in this case
//            if(Stack.pip(next) - 1 != Stack.pip(top)) {
//                break;
//            }
//            top = next;
//        }
//        // replace popped cards
//        this.extend(moveable);
//        this.canMove = moveable.length();
//        
//        // the returned array is upsidedown
//        return moveable;
//    }
//    
    doLayout() {
        for(var i = 0; i < this.length(); i++) {  
            
            this.childDivs[i].css("z-index", i)
                             .css("width", "" + this.width + "vw")
                             .css("left", "" + this.col*(this.width + 2*this.padding) + "vw")
                             .css("top", "+" + (1+i)*2 + "vh");
        }
        this.markCardsIfMoreThanOneCardCanMove();
    }
    
    markCardsIfMoreThanOneCardCanMove() {
        var count = this.howManyCardsCanMove();
        if(count > 1) {
            var firstInsertionPoint = this.childDivs.length - count;
            var secondInsertionPoint = this.childDivs.length - 1;
            var firstChildDiv = this.childDivs[firstInsertionPoint];
            var secondChildDiv = this.childDivs[secondInsertionPoint];
            $(firstChildDiv).css("border-style", "solid")
                            .css("border-color", "green")
                            .css("border-width", "5px");

            $(secondChildDiv).css("border-style", "solid")
                             .css("border-color", "red")
                             .css("border-width", "5px");
//            var theHtml = "<div id='extra'>";
//            var firstExtraDiv = $(theHtml).clone();
//            $(firstChildDiv).append(firstExtraDiv);
//            var secondExtraDiv = $(theHtml).clone();
//            $(secondChildDiv).append(secondExtraDiv);

            if(this.col == 0) {
                console.log("count: " + count);
                console.log("length: " + this.childDivs.length);
                console.log("1st: " + firstInsertionPoint);
                console.log("2nd: " + secondInsertionPoint);
            }
        }        
    }
    
    howManyCardsCanMove() {
        var moveable = [];
        var divs = this.childDivs;
        var top = divs[divs.length - 1];
        for(var i = divs.length - 2; i >= 0; i--) {
            moveable.push(top);
            var next = divs[i];  // might be undefined, but if statement below will work in this case
            var topIndex = top.data("card-info").index;
            var nextIndex = next.data("card-info").index;
            if(Stack.pip(nextIndex) - 1 != Stack.pip(topIndex)) {
                break;              
            }
            top = next;
        }
        var howMany = moveable.length;
        return howMany;
    }

    length() {
        return this.childDivs.length;
    }
    
    makeDraggable(div) {
        div.draggable(
            { 
                drag: function(e, ui) { 
                    cardBeingDragged = $(this);
                },
                stop: function(e, ui) {
                    console.log("stop drag");   
                    theStack = Stack.getStack(this);
                    theStack.doLayout();
                } 
            });        
    }

    makeDroppable(div) {
        div.droppable(
            { 
                drop: function (event, ui) { 
                    console.log("dropped");
                    console.log("drag card: " + cardBeingDragged.data("card-info").card);
                    console.log("drop card: " + $(this).data("card-info").card);
                    var dragStackNo = cardBeingDragged.data("card-info").col;
                    var dropStackNo = $(this).data("card-info").col;
                    var dropStack = stacks[dropStackNo];
                    var dragStack = stacks[dragStackNo];
                    dropStack.transfer(cardBeingDragged, dragStack);
                }
            });        
    }

    push() {
        var index = cardIndex.pop();
        var part1 = "<div><img style='width: 100%; height: auto;' src='images/cards/";
        var part2 = cards[index%52];    // %52 because of 2 packs of cards
        var part3 = "'/></div>";
        var theHtml = part1 + part2 + part3;
        var childDiv = $(theHtml).clone();
        var selector = "div#col" + this.col;
        $(selector).append(childDiv);
        this.addAttributes(childDiv, index);
        this.makeDroppable(childDiv);
        this.makeDraggable(childDiv);
        this.childDivs.push(childDiv);
    }
    
    pushBlank() {
        var theHtml = "<div><img style='width: 100%; height: auto;' src='images/cards/blank.svg'/></div>";
        var childDiv = $(theHtml).clone();
        var selector = "div#col" + this.col;
        $(selector).append(childDiv);
        childDiv.css("visibility", "hidden");
        this.addAttributes(childDiv, -1);
        this.makeDroppable(childDiv);
        this.makeDraggable(childDiv);
        this.childDivs.push(childDiv);
    }
    
    setupDraggableOnBottomCard() {
        var topDiv = this.childDivs.pop();
        this.makeDraggable(topDiv);
        this.childDivs.push(topDiv);
        topDiv.draggable("enable");
        
        for(var i = 0; i < this.length() - 1; i++) {  
            var div = this.childDivs[i];
            div.draggable("disable");
        }
    }

    transfer(div, dragStack) {
        // disable drag on previous top
        var top = this.childDivs.pop();
        top.draggable('disable');
        this.childDivs.push(top);

        // remove div from old stack
        dragStack.childDivs.pop();
        
        // add div to stack
        this.childDivs.push(div);
        div.data("card-info").col = this.col;
        
        // add div to dom
        var selector = "div#col" + this.col;
        $(selector).append(div);
        
        // make top div draggable on drag stack
        if(dragStack.length() > 0) dragStack.setupDraggableOnBottomCard();
        
        // redo layout for stack
        this.doLayout();
    }
    
//    transferToAnotherStack(numberOfCards, other) {
//        for(var i = 0; i < numberOfCards; i++) {
//            other.push(this.pop());
//        }
//    }    
}
