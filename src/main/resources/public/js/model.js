//  [EDT]   //
function Edt(){}
Edt.prototype = {
	API_PATH 	: "/edt",

	delete 		: function(){ return http().delete	(this.API_PATH + '/' + this._id).done(function(){ notify.info('edt.notify.deleted') }) },
	trash 		: function(){ return http().put		(this.API_PATH + '/' + this._id + '/trash').done(function(){ notify.info('edt.notify.trashed') }) },
	restore 	: function(){ return http().put		(this.API_PATH + '/' + this._id + '/recover').done(function(){ notify.info('edt.notify.restored') }) },
	create 		: function(hook){
		var edt = this
		return http().postJson(this.API_PATH, {
			"title": 		edt.title,
			"thumbnail": 	(edt.thumbnail === undefined ? "" : edt.thumbnail)
		}).done(function(){ notify.info('edt.notify.saved'); hook() })
	},
	update : function(hook){
		var edt = this
		return http().putJson(this.API_PATH + '/' + this._id, {
			"title": 		edt.title,
			"thumbnail": 	edt.thumbnail
		}).done(function(){ notify.info('edt.notify.modified'); hook() })
	},
    get : function(hook){
        var edt = this
        return http().get(this.API_PATH + "/get/" + this._id).done(function(data){
            for (var prop in data) {
                if (data.hasOwnProperty(prop)){
                    edt[prop] = data[prop]
                }
            }
            hook()
        })
    }
}

//  [EDT COLLECTION]   //
function EdtCollection(){
	this.collection(Edt, {
		behaviours: 'edt',
		folder: 'mine',
		sync: function(){
			http().get("edt/list").done(function(data){
				this.load(data)
				this.all.forEach(function(item){ delete item.data })
			}.bind(this))
		},
		remove: function(){
			collection = this
			var parsedCount = 0
			this.selection().forEach(function(item){
				if(collection.folder === 'trash'){
					item.delete().done(function(){
						if(++parsedCount === collection.selection().length)
							collection.sync()
					})
				}
				else{
					item.trash().done(function(){
						if(++parsedCount === collection.selection().length)
							collection.sync()
					})
				}
			})
		},
		restore: function(){
			collection = this
			var parsedCount = 0
			this.selection().forEach(function(item){
				item.restore().done(function(){
					if(++parsedCount === collection.selection().length)
						collection.sync()
				})
			})
		}
	})
}

///////////////////////
///   MODEL.BUILD   ///

model.build = function(){
	model.me.workflow.load(['edt'])
	this.makeModels([Edt, EdtCollection])

	this.edtCollection = new EdtCollection()
}

///////////////////////
