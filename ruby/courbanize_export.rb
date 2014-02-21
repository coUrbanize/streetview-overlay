# script to get the bounding box of a model
# and to export this info in lat/long

require 'sketchup.rb'

class GeoInfo

### Options Dialog
#========================
def GeoInfo::options_dialog
    puts "generate world file"
    else
        puts "User cancelled operation."
        exit
    end
end
#========================

#========================
def GeoInfo::write_geoinfo
  model=Sketchup.active_model
  if (model)
        GeoInfo.go
  else
        @errorcode=1
        GeoInfo.errormsg
  end
end
#========================

#========================
def GeoInfo::go

    wdir= Dir.getwd.split("/").join+"\\"
    dir_fname=UI.savepanel"Pick Directory ", "" , "geoinfo.js"

    if (dir_fname)
      puts dir_fname
    else
      puts "User cancelled operation."
      exit
    end

    dir_model=UI.savepanel"Pick Directory ", "" , "model.dae"

    if (dir_model)
      puts dir_model
    else
      puts "User cancelled operation."
      exit
    end

    # get active model
    model=Sketchup.active_model

    # get bounding box
    model_bb = model.bounds

    # get center point of bounding box
    model_center = model_bb.center
    model_center_latlong = model.point_to_latlong(model_center)

    # BoundingBox.corner
    # The corner method is used to retrieve a point object at a specified corner of the bounding box.
    #
    # There are 8 corners to a bounding box, identified by the numbers 0 through
    #
    # . Points are returned in the currently set units (inches, by default). These
    # are which index refers to which corner:
    # 0 = [0, 0, 0] (left front bottom)
    # 1 = [1, 0, 0] (right front bottom)
    # 2 = [0, 1, 0] (left back bottom)
    # 3 = [1, 1, 0] (right back bottom)
    # 4 = [0, 0, 1] (left front top)
    # 5 = [1, 0, 1] (right front top)
    # 6 = [0, 1, 1] (left back top)
    # 7 = [1, 1, 1] (right back top)

    # get four corners at base
    left_front = model_bb.corner(0)
    right_front = model_bb.corner(1)
    left_back = model_bb.corner(2)
    right_back = model_bb.corner(3)

    # convert center point to lat/lon
    left_front_latlong = model.point_to_latlong(left_front)
    right_front_latlong = model.point_to_latlong(right_front)
    left_back_latlong = model.point_to_latlong(left_back)
    right_back_latlong = model.point_to_latlong(right_back)

    File.open(dir_fname, 'w') { |file| file.write(
      "bounding_box = {'left_front': [" + left_front_latlong[1].to_f.to_s + ", " + left_front_latlong[0].to_f.to_s + "],\n" \
    + "'right_front': ["+ right_front_latlong[1].to_f.to_s  + ", " + right_front_latlong[0].to_f.to_s + "],\n" \
    + "'left_back': ["+ left_back_latlong[1].to_f.to_s  + ", " + left_back_latlong[0].to_f.to_s + "],\n" \
    + "'right_back': ["+ right_back_latlong[1].to_f.to_s  + ", " + right_back_latlong[0].to_f.to_s + "]};\n\n" \
    + "center_point = [" + model_center_latlong[1].to_f.to_s + ", " + model_center_latlong[0].to_f.to_s + "];\n" \
    )}

    # export colladae file
    options_hash = {  :triangulated_faces   => true,
                      :doublesided_faces    => true,
                      :edges                => false,
                      :materials_by_layer   => false,
                      :author_attribution   => false,
                      :texture_maps         => true,
                      :selectionset_only    => false,
                      :preserve_instancing  => true }

    status = model.export dir_model, options_hash

    Sketchup.set_status_text "Writing model and geolocation"

    UI.messagebox "You have exported model and geolocation information\n"

#========================
end ### End class GeoInfo

#=============================================================================

# Add option to File menubar
if (not file_loaded?("courbanize_export.rb"))
  add_separator_to_menu("File")
  UI.menu("File").add_item("Courbanize GeoPosition") { GeoInfo.write_geoinfo }
end

file_loaded ("courbanize_export.rb")
