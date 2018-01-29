class Stack {

    static getStack(div) {
        var stackNo = $(div).data("card-info").col;
        return stacks[stackNo];
    }
    
    static howManyCardsCanMove(stack) {
        var moveable = [];
        var divs = stack.childDivs;
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

    static pip(cardIndex) {
        // Ace(12) -> 1
        // Two(0) -> 2
        // ...
        // King(11) -> 13
        return (cardIndex + 1) % 13 + 1;
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
        var card = (index === undefined) ? "blank.svg" : cards[index%52];
        
        div.data("card-info", 
            { 
                col:this.col,
                index:index,
                card:card
            });
    }

    doLayout() {
        for(var i = 0; i < this.length(); i++) {  
            
            this.childDivs[i].css("z-index", i)
                             .css("width", "" + this.width + "vw")
                             .css("left", "" + this.col*(this.width + 2*this.padding) + "vw")
                             .css("top", "+" + (1+i)*2 + "vh");
        }
        this.markCardsIfMoreThanOneCardCanMove();
    }
    
    //  !!!!!!!!!!! this will be removed later (only used for debugging) !!!!!!!!!!!!!!!!!!!
    howManyCardsCanMove3() {
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
                        function howManyCardsToDrop(dropStack) {
                            // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! NOT WORKING !!!!!!!!!!!!!!!!!!!!!!!!!
                            // always drop on empty stack
                            var dropDivs = dropStack.childDivs;
                            if(dropDivs.length === 1) return true;
                            
                            // need to rethink algorithm:
                            // if no empty stacks
                            //   stacks must contain ascending cards, e.g 10,J,Q
                            // if 1 empty stack
                            //   stacks can also contain 2 descending cards, e.g.  6,5  
                            // if 2 empty stacks
                            //   stacks can also contain 4 descending cards, e.g.  7,6,5,4  
                            // if 3 empty stacks
                            //   stacks can also contain 8 descending cards, e.g.  10,9,8,7,6,5,4,3  
                            // if 4 empty stacks
                            //   stacks can also contain any number of descending cards  
                            // check how many cards can be dropped
                            dragStackNo = cardBeingDragged.data("card-info").col;
                            dragStack = stacks[dragStackNo];
                            var howManyCardsCanMove = Stack.howManyCardsCanMove(dragStack);
                            
                            // say drop-top is 8
                            // howMany = 3
                            // then if we are dropping a 5 its OK if we drop 6,7 as well
                            // then if we are dropping a 6 its OK if we drop 7 as well
                            // then if we are dropping a 7 its OK if we don't drop anything else
                            var topCardOnDropStack = dropDivs[dropDivs.length - 1];
                            var topPip = Stack.pip(topCardOnDropStack.data("card-info").index);
                            var dragPip = Stack.pip(cardBeingDragged.data("card-info").index);
                            var cardsToTransfer = topPip - dragPip;
                            console.log("max cards to xfer: " + howManyCardsCanMove);
                            console.log("cards to xfer: " + cardsToTransfer);
                            
                            if(cardsToTransfer <= howManyCardsCanMove)
                                return cardsToTransfer;
                            else
                                return 0;
                        }
                    if(cardBeingDragged === undefined) return;  // multiple drops
                    console.log("dropped");
                    var dragStackNo = cardBeingDragged.data("card-info").col;
                    var dropStackNo = $(this).data("card-info").col;
                    var dropStack = stacks[dropStackNo];
                    var dragStack = stacks[dragStackNo];
                    var count = howManyCardsToDrop(dropStack);
                    var dropStackLength = dropStack.childDivs.length;
                    for(var i = 0; i < count; i++)
                    {
                        dropStack.childDivs[dropStackLength - i - 1];
                        dropStack.transfer(cardBeingDragged, dragStack);
                    } 
                    cardBeingDragged = undefined;  // to avoid multiple drops
                }
            });        
    }

    markCardsIfMoreThanOneCardCanMove() {
        var count = this.howManyCardsCanMove3();
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
        }        
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
        this.addAttributes(childDiv, undefined);
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

    transferMultipleDescending(dropStack, dragStack, count) {
        // e.g. transfer 3 from:  K5J876
        // transfer 8, then 7, then 6
    }
    
    transferMultipleAscending(dropStack, dragStack, count) {
        // e.g. transfer 3 from:  K5J678
        // transfer 8, then 7, then 6
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
}
