/**
	Application routes.
**/
routes.define(function($routeProvider){
	$routeProvider
		.otherwise({
			action: 'defaultView'
		})
})

/**
	Wrapper controller
	------------------
	Main controller.
**/
function EdtController($scope, $rootScope, model, template, route, date){

	$scope.template = template

	route({
		defaultView: function(){
			$scope.openView('main', 'library')
		}
	})

	$rootScope.longDate = function(dateStr){
		return date.create(dateStr.split(' ')[0]).format('DD MMMM YYYY')
	}

	$scope.openView = function(container, view){
		if(container === "lightbox")
			ui.showLightbox()
		else
			ui.hideLightbox()
		template.open(container, view)
	}

}

/**
	FolderController
	----------------
	Edt are split in 3 "folders" :
		- Ownermade
		- Shared
		- Deleted
	This controller helps dealing with these 3 views.
**/
function FolderController($scope, $rootScope, model, template){

	$scope.edtList = model.edtCollection.edts
	$scope.filterEdt = {}
	$scope.select = { all: false }
	$scope.ordering = 'title'

	var DEFAULT_VIEW = function(){
		if(model.me.workflow.edt.create !== true)
			$scope.folders["shared"].list()
		else
			$scope.folders["mine"].list()
	}

	//////////////////////
	// Edt listing //
	//////////////////////

	var refreshListing = function(folder){
		$scope.select.all = false
		$scope.edtList.sync()
		if(typeof folder === "string")
			$scope.edtList.folder = folder
		if(!template.contains('list', 'table-list') && !template.contains('list', 'icons-list'))
			$scope.openView('list', 'table-list')
	}

	$scope.folders = {
		"mine": {
			list: function(){
				$scope.filterEdt = {
					"owner.userId": model.me.userId,
					"trashed": 0
				}
				refreshListing("mine")
			},
			workflow: "edt.create"
		},
		"shared": {
			list: function(){
				$scope.filterEdt = function(item){
					return item.owner.userId !== model.me.userId
				}
				refreshListing("shared")
			}
		},
		"trash": {
			list: function(){
				$scope.filterEdt = {
					"trashed": 1
				}
				refreshListing("trash")
			},
			workflow: "edt.create"
		}
	}

	//Deep filtering an Object based on another Object properties
	//Supports "dot notation" for accessing nested objects, ex: ({a {b: 1}} can be filtered using {"a.b": 1})
	var deepObjectFilter = function(object, filter){
		for(var prop in filter){
			var splitted_prop 	= prop.split(".")
			var obj_value 		= object
			var filter_value 	= filter[prop]
			for(i = 0; i < splitted_prop.length; i++){
				obj_value 		= obj_value[splitted_prop[i]]
			}
			if(filter_value instanceof Object && obj_value instanceof Object){
				if(!deepObjectFilter(obj_value, filter_value))
					return false
			} else if(obj_value !== filter_value)
				return false
		}
		return true
	}
	var edtObjectFiltering = function(item){ return deepObjectFilter(item, $scope.filterEdt) }
	var selectMultiple = function(items){
		_.forEach(items, function(item){ item.selected = true })
	}

	$scope.switchAll = function(){
		if($scope.select.all){
			selectMultiple($scope.edtList.filter(edtObjectFiltering).filter(function(item){ return item.myRights.manager !== undefined }))
		}
		else{
			$scope.edtList.deselectAll();
		}
	}

	$scope.orderBy = function(what){
		$scope.ordering = ($scope.ordering === what ? '-' + what : what)
	}

	$scope.openedt = function(edt){
		$rootScope.edt = edt
		$scope.openView('main', 'edt')
	}

	/////////////////////////////////////
	// Edt creation /modification //
	/////////////////////////////////////

	$scope.newedt = function(){
		$scope.edt = new Edt()
		$scope.edtList.deselectAll()
		$scope.select.all = false
		$scope.openView('list', 'edt-infos')
	}

	$scope.editInfos = function(){
		$scope.edt = $scope.edtList.selection()[0]
		$scope.openView('list', 'edt-infos')
	}

	$scope.removeIcon = function(){
		$scope.edt.thumbnail = ""
	}

	$scope.removeedt = function(){
		$scope.edtList.remove()
		if(template.contains('list', 'edt-infos'))
			$scope.closeInfos()
	}

	$scope.saveInfos = function(){
		if(!$scope.edt.title){
			notify.error('edt.title.missing')
			return;
		}
		if($scope.edt._id){
			$scope.edt.update(DEFAULT_VIEW)
		}
		else{
			$scope.edt.create(DEFAULT_VIEW)
		}
	}

	$scope.closeInfos = function(){
		DEFAULT_VIEW()
	}

	$scope.shareedt = function(){
		$rootScope.sharedEdt = $scope.edtList.selection()
		$scope.openView('lightbox', 'share')
	}

	$rootScope.$on('share-updated', function(){
		$scope.edtList.sync()
	})

	//Default view displayed on opening
	DEFAULT_VIEW()

}
