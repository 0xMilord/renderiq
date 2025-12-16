#!/usr/bin/env ruby
# Package script for creating RBZ file
# Usage: ruby package.rb

require 'zip'
require 'fileutils'

def create_rbz
  plugin_name = 'renderiq'
  output_file = "#{plugin_name}.rbz"
  
  # Remove existing RBZ if it exists
  File.delete(output_file) if File.exist?(output_file)
  
  # Create RBZ (ZIP) file
  Zip::File.open(output_file, Zip::File::CREATE) do |zip|
    # Add all files from plugin directory
    Dir[File.join(plugin_name, '**', '**')].each do |file|
      next if File.directory?(file)
      
      # Get relative path
      relative_path = file.sub("#{plugin_name}/", '')
      
      # Add to zip
      zip.add(relative_path, file)
      puts "Added: #{relative_path}"
    end
    
    # Add main plugin file if it exists
    if File.exist?("#{plugin_name}.rb")
      zip.add("#{plugin_name}.rb", "#{plugin_name}.rb")
      puts "Added: #{plugin_name}.rb"
    end
  end
  
  puts "\n✅ Created #{output_file}"
  puts "   Size: #{File.size(output_file) / 1024} KB"
end

# Check if zip library is available
begin
  require 'zip'
rescue LoadError
  puts "❌ Error: 'zip' gem not found"
  puts "   Install with: gem install rubyzip"
  exit 1
end

# Run packaging
puts "📦 Packaging Renderiq SketchUp Plugin...\n\n"
create_rbz
puts "\n✅ Packaging complete!"








