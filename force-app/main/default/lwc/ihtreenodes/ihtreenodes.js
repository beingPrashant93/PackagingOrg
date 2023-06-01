import { LightningElement,api,track,wire } from 'lwc';
import myResource from '@salesforce/resourceUrl/iahelp__IHResources';
import logLUXInteraction from '@salesforce/apex/iahelp.ControllerLUXOps.logLUXInteraction';
import getTools from '@salesforce/apex/iahelp.ControllerLUXOps.getTools';
import { loadStyle } from 'lightning/platformResourceLoader';
import { publish,subscribe,APPLICATION_SCOPE,unsubscribe,createMessageContext,releaseMessageContext,MessageContext } from 'lightning/messageService';
import messageChannel from '@salesforce/messageChannel/MyMessageChannel__c';
export default class Ihtreenodes extends LightningElement {
    @api passThrough;
    @api nodedeselect;
    @api selectTopic;
    @api rootnode;
    temp=[];
    @wire(MessageContext)
    messageContext;
	subscription=null;
    @api treecontrol;
    @api componentid;
    @api expanded=false;
    @api isInitialised=false;
    @api listitems=[];
    @api supportsorder=false;
    @api nodeiconstyle;
    @api displaydensity='Comfy';
    @api listingtools=[];
    @api suppresslistingtools=false;
    @api maxlistingtools=-1;
    @track QualifyingListingTools=0;
    @api nodeexpandertip;
    @api delimiter;
    @api level=0;
    @api levelnew;
    @api get printcls(){ return ('slds-text-longform node level_'+this.level+1)};
    @api treecontrollevelindentation=0;
    @track iconClass;
    @api node;
    @api uxthemecolour1;
    @api aid;
    @api get globalStyle() { return ('color: #' + this.uxthemecolour1 + ';')};
    @api get nodeiconsmall(){ return (this.node.Icon != '' && this.nodeiconstyle == 'Small'?true:false) };
    @api get nodeiconlarge(){ return (this.node.Icon != '' && this.nodeiconstyle == 'Large'?true:false) };
    iclass1;
    iclass2;
    style1;
    nodecontainerid;
    @api advicelabeltools;
    @api globalsettings;
    @api nodeddallowed=false;
    //This is used to make seletion happen on tree node.
    @api get nodeClass(){
        return (this.node.StyleClass+' slds-tree__item slds-truncate TreeNodeContainer node'+this.displaydensity+' '+
        this.addcls);
    }
    //This is used for expanding the node when node.expanded value is getting updated.
    @api get expanding(){
        return this.node.Expanded;
    }
    @api addcls='';
    @track nodeid='';
    @api treecontrolprintview=false;
    @api nodelabel;
    @api get nodestyleclass() { return (this.node.StyleClass == 'IHHelpedSFElementError' ? 'slds-hide' : 'slds-col_bump-left')};
    @api collapselistingcls;
    @api get collapselistingtools(){
        return (this.QualifyingListingTools <= this.maxlistingtools || this.maxlistingtools==-1 ?
            'ListingToolsBlockExpanded_'+this.node.Id : 'slds-hide ListingToolsBlockExpanded_' + this.node.Id);
    }; 
    @track ellipsisShowHide='';
   // (){
    //    return (this.QualifyingListingTools <= this.maxlistingtools || this.maxlistingtools==-1 ?
    //        'slds-hide' : '');
    //};
   // @api get globalStyle() { return (this.globalsettings+''!=='undefined'?'color: #' + this.globalsettings.iahelp__BrandColour6__c  + ';' :'')};        
    @api get styleClass(){ return ('padding-left: ' + (this.treecontrollevelindentation * this.level) + 'rem;')};
    @api get nodeids(){ return (this.node+''!='undefined'?this.node.Id+this.delimiter+this.node.ParentId + this.delimiter + 'NodeOrdinal':'')};
    @api advicelabeldroptosort = 'Sort';
    connectedCallback(){
        console.log(' node '+this.node.Label+' expanded '+this.node.Expanded + this.expanded);
     //   this.listingtools=JSON.parse(JSON.stringify(this.listingtools))
        // On load of component, attributes are initialised
        this.listitems=this.listitems;
        this.listingtools=this.listingtools; 
        this.levelnew=this.level+1;
        this.nodeid = this.node.Id;
        this.node=JSON.parse(JSON.stringify(this.node)); //This is used to assign updated node content when it is getting updated from html page(self call), needed for expansion of nodes incase of tree search feature.
        this.node.Expanded=this.expanded;
        var T = this.treecontrol;
    console.log('this.treecontrol----',this.treecontrol);
    this.uxthemecolour1 = T.uxthemecolour1;

        Promise.all([
            loadStyle(this, myResource + '/lib/FontAwesome463/css/font-awesome.min.css')
        ])
        //this.treecontrolprintview=this.PrintView;
        // this.iconClass=this.node.items.length > 0 ?						
        // this.expanded == true ? 
        //     'nodeExpanded slds-button slds-button_icon slds-m-right_x-small' 
        //     : 'slds-button slds-button_icon slds-m-right_x-small'
        // : 'IHTwistyHidden slds-button slds-button_icon slds-m-right_x-small';   
        // if(this.node.items.length > 0 && this.node.Expanded){
        //     this.iconClass='nodeExpanded slds-button slds-button_icon slds-m-right_x-small';
            
        //     }
        //     if(this.node.items.length > 0 && !this.node.Expanded){
        //     this.iconClass = 'slds-button slds-button_icon slds-m-right_x-small';
            
           
        //     }
        //     if(this.node.items.length == 0 ){
        //     this.iconClass = 'IHTwistyHidden slds-button slds-button_icon slds-m-right_x-small';
        //     }
            this.iconClass = (this.node.items.length > 0 && this.node.Expanded)?'nodeExpanded slds-button slds-button_icon slds-m-right_x-small':
                              (this.node.items.length > 0 && !this.node.Expanded)?'slds-button slds-button_icon slds-m-right_x-small':'IHTwistyHidden slds-button slds-button_icon slds-m-right_x-small'; 
       
                              this.aid=this.node.Id + this.delimiter+this.node.ParentId;      
        this.iclass1='fa fa-fw fa-lg ' + this.node.Icon;					
        this.iclass2='fa fa-stack-1x ' + this.node.Icon;
        //this.style1='color: #' + this.globalsettings.iahelp__BrandColour6__c  + ';';
        this.nodecontainerid='NodeContainer_' + this.node.Id + this.node.ParentId;     
       // this.showAllowedNodeTools();
        this.handleSubscribe();
        
    }
    renderedCallback(){
        try{
            if(this.isInitialised==false){
                this.showAllowedNodeTools();
                this.isInitialised = true;
            }
        } catch(e){
            this.isInitialised = true;
        }
	}
//Toggles lightning icon
   toggle(){   
    this.expanded=!this.expanded; 
    this.node=JSON.parse(JSON.stringify(this.node));
    this.node.Expanded=!this.node.Expanded;
    console.log(this.node.Expanded);
    this.iconClass=this.node.items.length > 0 ?						
        this.expanded == true ? 
            'nodeExpanded slds-button slds-button_icon slds-m-right_x-small' 
            : 'slds-button slds-button_icon slds-m-right_x-small'
        : 'IHTwistyHidden slds-button slds-button_icon slds-m-right_x-small';       
        // As we expand nodes (and they render), re-check node tool availability (by un-latching doneRendering)
    this.isInitialised=false;
   } 
   //This method gets called when treenode tool is clicked.
   treeNodeToolClick(evt)
   {
        var theId=evt.currentTarget;
        var nodeid=theId.getAttribute("data-nodeid");
        var actioncode=theId.getAttribute("data-actioncode");
        var parentid=theId.getAttribute("data-parentid");
        var params = {ActionCode: actioncode,Parameters:nodeid+','+parentid,SourceComponent:this.componentid+'TreeNodes'};
        publish(this.messageContext, messageChannel, params);
   }
   //This method is getting called from node click. 
   treeNodeClick(evt){  
    evt.preventDefault();
    var nod=this.node;
    var dom=evt.currentTarget;
    var theId=dom.getAttribute("data-id");
    var parentid=dom.getAttribute("data-parentid");
    this.nodeid=theId;  
    this.nodedeselect = {ActionCode: 'TreeDeselectNodes',Parameters:theId,SourceComponent:this.componentid};
    publish(this.messageContext, messageChannel, this.nodedeselect);
    if (nod.ActionCode != '' && nod.ActionCode + '' != 'undefined') {
        this.passThrough = {ActionCode: nod.ActionCode,Parameters:nod.Id + '^' + nod.ParentId,SourceComponent:''};
        publish(this.messageContext, messageChannel, this.passThrough);
    }else {
        // If NO action code was supplied, revert to standard behaviour and issue a record select event
            
            // Fire a record selected event: Node clickable's is in the form: 
            // [Node Id] [Delimiter] [ParentId]
            this.selectTopic={RecordId:this.nodeid,SourceComponent:this.componentid};
            publish(this.messageContext, messageChannel, this.selectTopic);
    } 
    
     // In all cases, log a Tree Node click interaction
     logLUXInteraction({
            iTyp : "14",
            Description : theId,
            IHContext : this.rootnode
                }).then(result => {
                })
   }

handleSubscribe() {
    var msg;
    var msg2;
    var msg3;
    if (this.subscription) {
        return;
    }
    this.subscription = subscribe(this.messageContext, messageChannel, (message) => {  
     this.handleMessage(message);
    },{scope:APPLICATION_SCOPE});
}
//This method is getting called when 'TreeDeselectNodes' is fired, It makes selection of node clicked.
handleMessage(message) {
    if(message.ActionCode!='' && message.ActionCode+''!='undefined'){
        if(message.ActionCode =='TreeDeselectNodes' && message.SourceComponent == this.componentid){
            console.log('In TreeDeselectNodes ');
            this.addcls='';
            if(message.Parameters==this.nodeid){
                this.addcls=' nodeSelected';
            }
        }
        else{
            this.handlePassThroughs(message);       
        }
    }
    else{

    } 
}
//This method is used to handle all pass-through events.
handlePassThroughs(message){
        var act = message.ActionCode;
        var src = message.SourceComponent;
    	var T;
    	try {
	    	//T = cmp.get('v.TreeControl');
	        
	    	// Only respond to requests from our own tree
	    	//if (src === T.get("v.ComponentId")) {
	    	
		        if (act === 'TreeExpandAll') {                
                    this.expanded=true;
                    this.node.Expanded = this.expanded;
                    this.iconClass=this.node.items.length > 0 ?						
                    this.expanded == true ? 
                        'nodeExpanded slds-button slds-button_icon slds-m-right_x-small' 
                        : 'slds-button slds-button_icon slds-m-right_x-small'
                    : 'IHTwistyHidden slds-button slds-button_icon slds-m-right_x-small'; 
		        }
		
		        if (act === 'TreeCollapseAll') {
                    this.expanded=false;
                    this.node.Expanded = this.expanded;
                    this.iconClass=this.node.items.length > 0 ?						
                    this.expanded == true ? 
                        'nodeExpanded slds-button slds-button_icon slds-m-right_x-small' 
                        : 'slds-button slds-button_icon slds-m-right_x-small'
                    : 'IHTwistyHidden slds-button slds-button_icon slds-m-right_x-small';
		        }
		        
		        if (act === 'CardBodyScroll') {
		        //	var T = cmp.get('v.TreeControl');
		        //	var dvPeers = T.find("PopoverPeers");
		        }
	    	//}
                if(act ==='ToggleListingTools'){
                    this.toggleListingTools(message.Parameters);
                }
    	} catch (e) {
    		// Silent fail
    	}
}
//This method is used to toggle treenode menu panel
toggleListingTools(parms){
    
    parms=parms.split(',');// To separate parent id as in this case both data-parentid and data-nodeid attributes are set same value.  
   var tmp=parms[0];
    var tmp2=this.node.Id;
    var nodelist=this.template.querySelectorAll(".ListingToolsBlockExpanded_"+this.node.Id);
        nodelist.forEach( function(c){
            if(tmp2+''==tmp+''){
                console.log(' toggleListingTools '); // comparing node id coming through param and current node id.
                c.classList.toggle('slds-hide');
            }
            else{
                c.classList.add('slds-hide');
            }
        })
}
// For dragging of our own nodes, place suitable data into the drag
doDragStart(evt) {
    var T = evt.currentTarget;
    var D1 = '^';    
    var nid = T.getAttribute("data-id");
    var pid = T.getAttribute("data-parentid");
    var dat = 'TreeNode' + D1 + nid + D1 + pid;
    evt.dataTransfer.dropEffect = "move";
    
    // Send: drag type = TreeNode, dragged node ID, parent of that node:
    // As the ID of the draggable (node listing item) is already in this form, no processing required here...
    evt.dataTransfer.setData('text', dat);
   
    // D&D data is not available on drag over, so log a passthrough with this data 
		// so those dragged over know how to respond        
        var passThrough = {ActionCode: 'DragStart', Parameters:dat,SourceComponent:this.componentid+'TreeNodes'};
        publish(this.messageContext, messageChannel, passThrough);
}
// Show whether or not drop will be allowed
doDragOver(evt) {
    if(this.dragAllowed()==true){
           
            evt.preventDefault();

            var Nod = evt.currentTarget;
            var tmp=Nod.getAttribute("data-id");
            var Ns = this.template.querySelectorAll(".DropTarget");
            var Ord = this.template.querySelector('[data-divid="NodeOrdinal"]');
            var Tree = this.treecontrol;
            try {
                // Remove all styling from all nodes
                Ns.forEach(function(N){
                    N.classList.remove('DropTargetActive');
                    N.classList.remove('DropTargetUnavailable');
                });
                if(this.dropAllowed(evt)){
                    Nod.classList.add('DropTargetActive');
                }
                else{
                    Nod.classList.add('DropTargetUnavailable');
                }
                if (Tree.SupportsOrder+'' == 'true') {
                    // Show ordinal target if tree provider supports node ordering	
                    Ord.classList.remove('slds-hide');
                
                } /*else {
                // Add styling to target, as appropriate:
                
                    // Show node highlight if ordering not supported but drop is
                        Nod.classList.add('DropTargetActive');
                }*/
            } catch (e) {}
    }
}
doDragLeave(evt) {
    evt.preventDefault();	    
    var Nod = evt.currentTarget;
    var Ord = this.template.querySelector('[data-divid="NodeOrdinal"]');
    Nod.classList.remove('DropTargetActive');
    Nod.classList.remove('DropTargetUnavailable');

    // Hide ordinal if it's ordinal or overall container we're leaving
    if (Nod.classList.contains('NodeOrdinal') 
         //   || Nod.classList.contains('TreeNodeContainer')
            || (Nod.classList.contains('DropTarget') && evt.offsetY > 10)
            || (Nod.classList.contains('TreeNodeClickableContainer') && evt.offsetY > 10)		
        ){
            Ord.classList.add('slds-hide');  
    }  
}
// Take action when drop occurs
doDrop(evt) {
  //  console.log('In doDrop method ');
    var passThrough2;
    evt.preventDefault();
    
    var Tree = this.treecontrol;
    var Nod = evt.currentTarget;
    var Ord = this.template.querySelector('[data-divid="NodeOrdinal"]');
    var dat = evt.dataTransfer.getData("text");
    var D1 = '^'; 
    var isSortOp = Nod.classList.contains('NodeOrdinal');
   //var D1=this.delimiter;   
    var newParent = [];
    var parms = [];
    
    // Handling will be via a passthrough handled by parent tree...
    //var appEvent = $A.get("e.iahelp:evtPassThrough");
   // appEvent.setParams({"SourceComponent" : Tree.get('v.ComponentId') + 'TreeNodes'});


    parms = dat.split(D1);
    if(dat.includes('')){
        parms = dat.split('');
    }
    //newParent = Nod.id.split(D1);
    newParent = Nod.getAttribute("data-id");
    
    
    
    // Remove D&D styling clues
    Nod.classList.remove('DropTargetActive');
    Nod.classList.remove('DropTargetUnavailable');
    Ord.classList.add('slds-hide');    
    
    
    // Having removed visual clues, take no further action unless drop ops are allowed
    if (this.dropAllowed(evt) == false) {
        console.log('TreeNodes: drops not permitted - returning');
		return;
    }else{
        console.log('TreeNodes: drop permitted - continuing...');
        if (parms[0] == 'TreeNode' && Tree.SupportsOrder + '' == 'true' && isSortOp == true) {
            console.log('TreeNodes: sort operation - amending op and continuing...');
            parms[0] = 'SortOrder';
            
        } else {
            // Retain incoming op code / parameter 0
            console.log('TreeNodes: NOT a sort operation - continuing with specified op (' + parms[0] + ')...');	
            
        }
    
    }
    
    // Having established that we may proceed, respond according to request operation
    switch (parms[0]) {    
        case 'SortOrder' :
            // Need to locate the node record representing the one onto which we dropped
				// so we can obtain the desired new sort order
                var LIs = this.listitems;
				var SO;

				LIs.forEach(function(LI){
					if (LI.Id == newParent) {
						SO = LI.SortValue;
					}
				});
			passThrough2 = {ActionCode: 'TreeEditSortOrder',Parameters:parms[1] + D1 + parms[2] + D1 + newParent + D1 + SO,SourceComponent:this.componentid+'TreeNodes'};
            publish(this.messageContext, messageChannel, passThrough2);	        
		        // Child Id, desired sort order (that of the node we were dropped onto
            break;
        case 'TreeNode' :
            passThrough2 = {ActionCode: 'TreeReparentNode',Parameters:parms[1] + D1 + parms[2] + D1 + newParent,SourceComponent:this.componentid+'TreeNodes'};
            publish(this.messageContext, messageChannel, passThrough2);
            break; 
            
        case 'ListRow' :
        case 'DetailTitle' :
            // We're adding a node by dragging from a list or topic viewer (summary text)
		     // New child ID, node we were dropped onto (parent to be)           
            passThrough2 = {ActionCode: 'TreeAddChildFromExisting',Parameters:parms[1] + '' + newParent,SourceComponent:this.componentid+'TreeNodes'};
            publish(this.messageContext, messageChannel, passThrough2);
            break;				
    }
    
    
}
dropAllowed(evt) { 
    var retVal = false;  
    try {
        var dat = evt.dataTransfer.getData("text");
        var TNode = evt.currentTarget;
        var D1=this.delimiter;  
        var parms = [];
        var newParent = [];
        var T = this.treecontrol;

        var keyTypes = this.globalsettings.iahelp__SFObjectIds__c;
        keyTypes = keyTypes.split('^');
        
        // If we don't get drag data (varies by browser?) obtain it from tree
            // which will have kept a copy at the point where drag began (in response to passthrough)
		if (dat + '' == 'undefined' || dat + '' == 'null' || dat == ''){
			dat = T.dragdata;
		}

        parms = dat.split('^');
        if(dat.includes('')){
            parms = dat.split('');
        }
        newParent = TNode.getAttribute('data-id');
// Drop only allowed if tree says drag is allowed in general...
        if (this.dragAllowed() == false) {
            console.log('TreeNodes: Drop not permitted - parent tree component disallows');
        
        // ... AND node says it can accept a drop of this kind
        } else if (this.isPermittedChild(evt,parms[1]) == false) {
            console.log('TreeNodes: Drop not permitted - parent tree component allows this, but node does not support children of this type');  
        // ... AND we're not dropping node onto itself
        } else if (parms[1] == newParent) {
            console.log('TreeNodes: Cannot drop node onto itself');
        } else {          
            retVal = true;
        }

    } catch (e) {
        console.log(e);
    }
    return retVal;
}
// Returns a boolean indicating whether our node can accept a proposed 'child' (dropped item)
	// based on what the tree provider specified via the 'Supported Drops' list item / node member
isPermittedChild(evt,ChildId) {
		var retVal = false;
		var Tree = this.treecontrol;
        var TNode = evt.currentTarget;
        var isSortOp = TNode.classList.contains('NodeOrdinal');
		var N = this.node;
		var D1 = ',';
		var SDs = N.SupportedDrops;
		// Child must be specified (parent is ourselves / the current node)
		if (ChildId != '' && ChildId + '' != 'null' && ChildId + '' != 'undefined') {
			
			// Split node's supported drop information into details of each individual type that can be dropped
			if (SDs + '' != 'undefined' && SDs + '' != 'null') {
				SDs = SDs.split(D1);
				
				SDs.forEach(function (SD){
					if (SD != '') {
						if (ChildId.startsWith(SD)) {
							retVal = true;
						}
					}
				});
			}
		}			
        // Drop is also allowed if it is on to a sort ordinal and tree provider supports sort ops
		if (Tree.SupportsOrder + '' == 'true' && isSortOp == true) {
			retVal = true;
			//console.log('TreeNodes Helper: child "' + ChildId + '" may be dropped here because target is a sort ordinal and tree provider supports sorting');
		}
		return retVal;
	}
// Show listing (node) tools appropriate to record type of node according to config item tool filter
showAllowedNodeTools() {
    console.log('In showAllowedNodeTools ');
    // Loop through tools.
    // Remove hidden class on any whose required tool bit matches that tool's bits
    var LTs = this.listingtools;
    var N = this.node;
    var binFilter;
    var currentBit;
    var matchingRowTools;
    var toolQualified = false;
    var QualifyingTools = 0;
    var i;
    var j;
    var bitNo;
    var varthis=this;
    try {
        LTs.forEach(function(T) {
            // Get tool's tool filter bit code
            binFilter = T.lt.iahelp__ToolFilter__c;
            // Default this tool to not qualifying
            toolQualified = false;
            
            // Loop through filter to check each bit, starting at LSB (right-hand bit)
            for (i=binFilter.length; i>0; i--) {
                currentBit = binFilter.substr(i-1,1);
                
                // If bit is "on" for this tool at this position, show tools on rows requiring this bit
                if (currentBit+'' == '1') {
                    
                    // i = POSITION IN A BINARY STRING - HIGHEST NUMBER = LOWEST SIGNIFICANT BIT
                    // WE NEED THIS ADJUSTED TO REFLECT BINARY NUMBER LOGIC: EG
                    // Tool filter = 32 = 100000
                    // We need BIT 6 to be ON
                    // However, this is position 1 in binary string (not 6)
                    
                    bitNo = (binFilter.length - i) + 1;

                    // Un-hide any listing tools marked with the current (switched on) bit
                    matchingRowTools = varthis.template.querySelectorAll('[data-id="listingtools"]');
                    matchingRowTools.forEach(function(L) {                   
                        if(L.getAttribute("data-actioncode")==T.lt.iahelp__ActionCode__c 
                            && L.getAttribute("data-toolbit")==bitNo ){
                            L.classList.remove('slds-hide');
                        }	
                    })	    			
						
                    // The above un-hides tools - but these (by virtue of how we use DOM to find them) may not be 
                    // our own. We need to take note of whether we have matching tools so we can track how many total
                    // tools our node is showing - in case we need to collapse to an ellipsis (MaxListingTools etc.)
                    // Compare current tool's bit number with our node's to do this
                    if (bitNo == N.ToolBit) {
                        toolQualified = true;
                    }
                }
                
                // If bit is on for all types (-1 translated to marker code in tree Helper.setupNodes), show  tools regardless
	    			if (currentBit == '*') {
						matchingRowTools = varthis.template.querySelectorAll('[data-id="listingtools"]');
	    				
	    				matchingRowTools.forEach(function(L) {                   
                            if(L.getAttribute("data-actioncode")==T.lt.iahelp__ActionCode__c 
                                && L.getAttribute("data-toolbit")=='0' ){
                                L.classList.remove('slds-hide');
                            }	
                        })	
	    			}
            }
            
            
            // Increment the number of qualifying tools, where relevant
            if (toolQualified == true) {
                QualifyingTools += 1;
            }
        });
        // Note the total number of qualifying tools, for use in collapsing to ellipsis where max listing tools settings dictate this
        this.QualifyingListingTools = QualifyingTools;
        if(this.QualifyingListingTools <= this.maxlistingtools || this.maxlistingtools==-1){
            this.ellipsisShowHide='slds-hide';
        }
        else{
            this.ellipsisShowHide='';
        }
        //' ellipsisShowHide '+this.ellipsisShowHide);
    } catch (e) {}

}
dragAllowed() {
	
    var retVal = false;

    // Is user at least a Help Author?
    //For Test purpose it is made true
    var isHelpAuthor = true;
    
    // Has page owner specified D&D is allowed on this page?
    var DDLayout = this.nodeddallowed;
    
    // Simple boolean operators appear NOT to work!!
    if (isHelpAuthor == true && DDLayout == true) {retVal = true};
    console.log(' dragAllowed returning '+retVal);
    return retVal;
    
}

@api toggle2(evt){
    console.log('Mqax Depth: '+this.treecontrol.maxdepth);
    evt.preventDefault();
    var dom=evt.currentTarget;
    var theId=dom.getAttribute("data-id");
    console.log('theId: '+theId);
    
    console.log('IHTree - calling getTools ActionCode '+this.ActionCode + ' tool context '+this.toolcontext);
        try{       
            getTools({ToolContext : 'CardTree', 
                ActionCode : 'TreeNodes',
                IHContext : theId,
                ClientComponentId : 'tree', 
                Params : '1^undefined',
                SkipGlobals : false})
                .then(result => {
                    console.log(result);
                    /*this.res=result;
                    this.error = undefined;
                    this.processTools(result);
					this.isbusy=false;
//					this.hideSpinner()
					this.setupNodes(this);				
					this.AdviceLabelDropHereToSetRoot=this.Internationalise('AdviceLabelDropHereToSetRoot');
					this.advicelabeldroptosort = this.Internationalise('AdviceLabelDropToSort');
					var XCaps = [];
					var tmp=false;
					XCaps=this.extendedcapabilities;
					XCaps.forEach(function(XC){
						//if (XC.Name == 'JITFetching') {this.SupportsJIT=XC.Value;}
						if (XC.Name+'' == 'NodeOrdering') {
							tmp=XC.Value;						
						}
					});
					this.SupportsOrder=tmp;
					if(this.rootchange){
						this.RootNodeChange();
						this.rootchange=false;
					}
					else{

						var HRID = this.helprecordid;
						var root = this.rootnode;

						if (HRID == '') {
							HRID = root;
						}			  
						var selectTopic={ActionCode:'',RecordId:HRID,SourceComponent:this.componentid};
						publish(this.messageContext, messageChannel, selectTopic);
					}*/
					
					//this.hideSpinner();
				//	this.test=this.test;
				//	this.isbusy=this.isbusy;
					
                }).catch(error=>{
                    this.error = error;     
                    this.res='error';         
                })   
                 }
                catch(e){
                    console.log(e);
                } 
}

}